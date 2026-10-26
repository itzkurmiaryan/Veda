
const router = require('express').Router();

/*
|--------------------------------------------------------------------------
| Veda App Version
|--------------------------------------------------------------------------
*/

const LATEST_VERSION = '1.0.2';
const LATEST_VERSION_CODE = 8;

const APK_URL =
  'https://github.com/itzkurmiaryan/Veda/releases/latest/download/veda.apk';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.veda.app';

const FORCE_UPDATE = false;

const RELEASE_NOTES =
  'New medicine bottom-sheet picker, responsive tablet/PC layout, attractive A4 prescription PDF, Render server wake-up loading, and animated feedback pop-ups.';

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
