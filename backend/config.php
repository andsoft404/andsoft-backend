<?php
/**
 * АндСофт Backend - Configuration
 * Render.com + PostgreSQL config
 */

// Render provides DATABASE_URL environment variable
// Format: postgres://user:password@host:port/dbname
define('DATABASE_URL', getenv('DATABASE_URL') ?: '');

// Session / Security
define('SESSION_LIFETIME', 86400); // 24 цаг
define('CORS_ORIGIN', getenv('CORS_ORIGIN') ?: '*');

// Timezone
date_default_timezone_set('Asia/Ulaanbaatar');
