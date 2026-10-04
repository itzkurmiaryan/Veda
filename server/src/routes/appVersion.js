const router = require('express').Router();

/*
|--------------------------------------------------------------------------
| Veda App Version
|--------------------------------------------------------------------------
|
| Change these values whenever you release a new native APK/AAB.
|
*/

const LATEST_VERSION = '1.0.1';
const LATEST_VERSION_CODE = 2;

const APK_URL =
  'https://expo.dev/artifacts/eas/xUpHngJBXvJJKcFHDYdUFSS-XlaMuV_1gyzOLCXWPJc.apk';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.veda.app';

const FORCE_UPDATE = false;

const RELEASE_NOTES =
  'New improvements, bug fixes and performance updates.';

/*
|--------------------------------------------------------------------------
| GET /api/app-version
|--------------------------------------------------------------------------
*/

router.get('/', (req, res) => {
  res.json({
    success: true,

    appName: 'Veda',

    version: LATEST_VERSION,

    versionCode: LATEST_VERSION_CODE,

    forceUpdate: FORCE_UPDATE,

    downloadUrl: APK_URL,

    playStoreUrl: PLAY_STORE_URL,

    releaseNotes: RELEASE_NOTES,
  });
});

module.exports = router;