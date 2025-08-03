const mongoose = require('mongoose');

// MongoDB connection
let isConnected = false;

async function connectDB() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        await mongoose.connect(mongoUri, {
            maxPoolSize: 5, // Reduced for serverless
            serverSelectionTimeoutMS: 10000, // Increased timeout
            socketTimeoutMS: 30000, // Reduced timeout
            connectTimeoutMS: 10000, // Connection timeout
            dbName: 'tweet_extractor', // Use dedicated database for this project
            retryWrites: true,
            w: 'majority'
        });

        isConnected = true;
        
        // Set up connection event handlers
        mongoose.connection.on('error', (err) => {
            isConnected = false;
        });
        
        mongoose.connection.on('disconnected', () => {
            isConnected = false;
        });
        
    } catch (error) {
        isConnected = false;
        throw error;
    }
}

// User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true, // Allow null values but ensure uniqueness when present
        trim: true
    },
    password_hash: {
        type: String,
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    last_login: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Archive Schema
const archiveSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    s3_key: {
        type: String,
        required: true
    },
    s3_url: {
        type: String,
        required: true
    },
    file_size: {
        type: Number,
        required: true
    },
    content_type: {
        type: String,
        default: 'text/html'
    },
    profile_info: {
        username: {
            type: String,
            default: 'user'
        },
        displayName: {
            type: String,
            default: 'User'
        },
        bio: {
            type: String,
            default: ''
        },
        followers: {
            type: Number,
            default: 0
        },
        following: {
            type: Number,
            default: 0
        }
    },
    tweet_count: {
        type: Number,
        default: 100
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Additional indexes for better performance (unique indexes are auto-created)
archiveSchema.index({ user_id: 1, created_at: -1 }); // Compound index for user queries

// Models with project-specific collection names
const User = mongoose.models.TweetUser || mongoose.model('TweetUser', userSchema, 'tweet_users');
const Archive = mongoose.models.TweetArchive || mongoose.model('TweetArchive', archiveSchema, 'tweet_archives');

// Initialize database
async function initDatabase() {
    try {
        await connectDB();
    } catch (error) {
        throw error;
    }
}

// Get database info (for debugging/monitoring)
async function getDatabaseInfo() {
    try {
        await connectDB();
        const dbName = mongoose.connection.db.databaseName;
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        return {
            database: dbName,
            collections: collections.map(col => col.name),
            connection_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
        };
    } catch (error) {
        return { error: error.message };
    }
}

// User operations
const UserDB = {
    // Create a new user
    create: async (userData) => {
        try {
            await connectDB();
            
            const { email, phone, password_hash } = userData;
            
            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [
                    { email: email.toLowerCase() },
                    ...(phone ? [{ phone: phone }] : [])
                ]
            });
            
            if (existingUser) {
                if (existingUser.email === email.toLowerCase()) {
                    throw { field: 'email', error: 'Email already exists' };
                }
                if (phone && existingUser.phone === phone) {
                    throw { field: 'phone', error: 'Phone number already exists' };
                }
            }
            
            // Create new user
            const user = new User({
                email: email.toLowerCase(),
                phone: phone || null,
                password_hash
            });
            
            const savedUser = await user.save();
            
            return {
                id: savedUser._id,
                email: savedUser.email,
                phone: savedUser.phone,
                created_at: savedUser.created_at
            };
        } catch (error) {
            if (error.code === 11000) {
                // MongoDB duplicate key error
                const field = Object.keys(error.keyPattern)[0];
                throw {
                    field: field,
                    error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
                };
            }
            throw error;
        }
    },

    // Find user by email or phone
    findByEmailOrPhone: async (emailOrPhone) => {
        try {
            await connectDB();
            
            const user = await User.findOne({
                $and: [
                    { is_active: true },
                    {
                        $or: [
                            { email: emailOrPhone.toLowerCase() },
                            { phone: emailOrPhone }
                        ]
                    }
                ]
            });
            
            return user;
        } catch (error) {
            throw { error: 'Database error: ' + error.message };
        }
    },

    // Update last login
    updateLastLogin: async (userId) => {
        try {
            await connectDB();
            
            const result = await User.updateOne(
                { _id: userId },
                { last_login: new Date() }
            );
            
            return result.modifiedCount > 0;
        } catch (error) {
            throw { error: 'Database error: ' + error.message };
        }
    },

    // Get user by ID
    findById: async (userId) => {
        try {
            await connectDB();
            
            const user = await User.findOne({
                _id: userId,
                is_active: true
            }).select('-password_hash');
            
            if (user) {
                return {
                    id: user._id,
                    email: user.email,
                    phone: user.phone,
                    created_at: user.created_at,
                    last_login: user.last_login
                };
            }
            
            return null;
        } catch (error) {
            throw { error: 'Database error: ' + error.message };
        }
    }
};

// Archive operations
const ArchiveDB = {
    // Create a new archive record
    create: async (archiveData) => {
        try {
            await connectDB();
            
            const { user_id, filename, s3_key, s3_url, file_size, content_type, profile_info, tweet_count } = archiveData;
            
            const archive = new Archive({
                user_id,
                filename,
                s3_key,
                s3_url,
                file_size,
                content_type,
                profile_info: profile_info || {
                    username: 'user',
                    displayName: 'User',
                    bio: '',
                    followers: 0,
                    following: 0
                },
                tweet_count: tweet_count || 100
            });
            
            const savedArchive = await archive.save();
            
            return {
                id: savedArchive._id,
                _id: savedArchive._id, // Also include _id for compatibility
                user_id: savedArchive.user_id,
                filename: savedArchive.filename,
                s3_key: savedArchive.s3_key,
                s3_url: savedArchive.s3_url,
                file_size: savedArchive.file_size,
                content_type: savedArchive.content_type,
                profile_info: savedArchive.profile_info,
                tweet_count: savedArchive.tweet_count,
                created_at: savedArchive.created_at
            };
        } catch (error) {
            throw { error: 'Database error: ' + error.message };
        }
    },

    // Get archives for a specific user
    findByUserId: async (userId, limit = 10, offset = 0) => {
        try {
            await connectDB();
            
            const archives = await Archive.find({ user_id: userId })
                .sort({ created_at: -1 })
                .limit(limit)
                .skip(offset)
                .lean(); // Return plain JavaScript objects instead of Mongoose documents
            
            console.log('🔍 [DB] Raw archives from database:', archives.length);
            if (archives.length > 0) {
                console.log('🔍 [DB] First archive keys:', Object.keys(archives[0]));
                console.log('🔍 [DB] First archive _id:', archives[0]._id);
            }
            
            return archives.map(archive => ({
                id: archive._id,
                _id: archive._id, // Also include _id for compatibility
                user_id: archive.user_id,
                filename: archive.filename,
                s3_key: archive.s3_key,
                s3_url: archive.s3_url,
                file_size: archive.file_size,
                content_type: archive.content_type,
                profile_info: archive.profile_info || {
                    username: 'user',
                    displayName: 'User',
                    bio: '',
                    followers: 0,
                    following: 0
                },
                tweet_count: archive.tweet_count || 100,
                created_at: archive.created_at
            }));
        } catch (error) {
            throw { error: 'Database error: ' + error.message };
        }
    },

    // Get archive by ID
    findById: async (archiveId) => {
        try {
            await connectDB();
            
            const archive = await Archive.findById(archiveId).lean();
            
            if (!archive) {
                return null;
            }
            
            console.log('🔍 [DB] Found archive by ID:', archiveId);
            console.log('🔍 [DB] Archive _id:', archive._id);
            
            return {
                id: archive._id,
                _id: archive._id, // Also include _id for compatibility
                user_id: archive.user_id,
                filename: archive.filename,
                s3_key: archive.s3_key,
                s3_url: archive.s3_url,
                file_size: archive.file_size,
                content_type: archive.content_type,
                profile_info: archive.profile_info || {
                    username: 'user',
                    displayName: 'User',
                    bio: '',
                    followers: 0,
                    following: 0
                },
                tweet_count: archive.tweet_count || 100,
                created_at: archive.created_at
            };
        } catch (error) {
            throw { error: 'Database error: ' + error.message };
        }
    },

    // Get archive statistics for a user
    getStats: async (userId) => {
        try {
            await connectDB();
            
            const aggregation = await Archive.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: null,
                        total_archives: { $sum: 1 },
                        total_size: { $sum: '$file_size' },
                        last_archive_date: { $max: '$created_at' }
                    }
                }
            ]);
            
            if (aggregation.length === 0) {
                return {
                    total_archives: 0,
                    total_size: 0,
                    last_archive_date: null
                };
            }
            
            const stats = aggregation[0];
            return {
                total_archives: stats.total_archives || 0,
                total_size: stats.total_size || 0,
                last_archive_date: stats.last_archive_date || null
            };
        } catch (error) {
            throw { error: 'Database error: ' + error.message };
        }
    },

    // Delete archive by ID
    deleteById: async (archiveId) => {
        try {
            await connectDB();
            
            const result = await Archive.findByIdAndDelete(archiveId);
            
            if (!result) {
                throw { error: 'Archive not found' };
            }
            
            return {
                success: true,
                deletedArchive: {
                    id: result._id,
                    filename: result.filename,
                    s3_key: result.s3_key
                }
            };
        } catch (error) {
            throw { error: 'Database error: ' + error.message };
        }
    }
};

module.exports = {
    initDatabase,
    getDatabaseInfo,
    connectDB,
    UserDB,
    ArchiveDB
};