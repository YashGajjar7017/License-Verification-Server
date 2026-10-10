/**
 * Passport.js Configuration
 * Configures Google OAuth 2.0 strategy.
 */

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');
const logger = require('../utils/logger');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // Try to find existing user by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if account exists with same email (link accounts)
          user = await User.findOne({ email });

          if (user) {
            // Link Google account to existing email user
            user.googleId = profile.id;
            user.avatar = user.avatar || profile.photos?.[0]?.value;
            await user.save();
          } else {
            // Create new user from Google profile
            user = await User.create({
              googleId: profile.id,
              email,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              role: 'user',
              isEmailVerified: true, // Google verifies emails
            });
            logger.info('New user created via Google OAuth', { email });
          }
        }

        return done(null, user);
      } catch (err) {
        logger.error('Google OAuth error:', { error: err.message });
        return done(err, null);
      }
    }
  )
);

// Passport serialize/deserialize (minimal — we use JWT primarily)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
