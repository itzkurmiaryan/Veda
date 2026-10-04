
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as Application from 'expo-application';

// Expo SDK 54
// Legacy FileSystem APIs are used for APK downloading
// and converting the file URI to a content URI.
import * as FileSystem from 'expo-file-system/legacy';

import * as IntentLauncher from 'expo-intent-launcher';

import axios from 'axios';


/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  'https://veda-v3wh.onrender.com/api';

const VERSION_CHECK_URL =
  `${API_BASE_URL}/app-version`;


/*
|--------------------------------------------------------------------------
| Version Comparison
|--------------------------------------------------------------------------
*/

const isNewerVersion = (
  currentVersion,
  latestVersion
) => {

  if (
    !currentVersion ||
    !latestVersion
  ) {
    return false;
  }

  const current =
    String(currentVersion)
      .split('.')
      .map((value) => {

        const number =
          parseInt(value, 10);

        return Number.isNaN(number)
          ? 0
          : number;

      });


  const latest =
    String(latestVersion)
      .split('.')
      .map((value) => {

        const number =
          parseInt(value, 10);

        return Number.isNaN(number)
          ? 0
          : number;

      });


  const length =
    Math.max(
      current.length,
      latest.length
    );


  for (
    let index = 0;
    index < length;
    index += 1
  ) {

    const currentValue =
      current[index] || 0;

    const latestValue =
      latest[index] || 0;


    if (
      latestValue >
      currentValue
    ) {
      return true;
    }


    if (
      latestValue <
      currentValue
    ) {
      return false;
    }

  }


  return false;
};


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function AppUpdateChecker() {

  const [
    visible,
    setVisible,
  ] = useState(false);


  const [
    checking,
    setChecking,
  ] = useState(false);


  const [
    updating,
    setUpdating,
  ] = useState(false);


  const [
    updateInfo,
    setUpdateInfo,
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | Check For Update
  |--------------------------------------------------------------------------
  */

  const checkForUpdate =
    useCallback(async () => {

      /*
      |--------------------------------------------------------------------------
      | Android only
      |--------------------------------------------------------------------------
      */

      if (
        Platform.OS !== 'android'
      ) {
        return;
      }


      /*
      |--------------------------------------------------------------------------
      | Current installed version
      |--------------------------------------------------------------------------
      */

      const currentVersion =
        Application.nativeApplicationVersion;


      if (!currentVersion) {

        console.log(
          'Veda: Current application version not found.'
        );

        return;

      }


      try {

        setChecking(true);


        console.log(
          'Veda current version:',
          currentVersion
        );


        console.log(
          'Checking update:',
          VERSION_CHECK_URL
        );


        /*
        |--------------------------------------------------------------------------
        | Backend request
        |--------------------------------------------------------------------------
        */

        const response =
          await axios.get(
            VERSION_CHECK_URL,
            {
              timeout: 10000,
            }
          );


        const data =
          response?.data;


        console.log(
          'Veda update response:',
          data
        );


        if (
          !data ||
          !data.success
        ) {

          console.log(
            'Veda: Invalid update response.'
          );

          return;

        }


        const latestVersion =
          data.version;


        /*
        |--------------------------------------------------------------------------
        | Compare versions
        |--------------------------------------------------------------------------
        */

        const updateAvailable =
          isNewerVersion(
            currentVersion,
            latestVersion
          );


        console.log(
          'Veda update available:',
          updateAvailable
        );


        if (
          updateAvailable
        ) {

          setUpdateInfo({

            currentVersion,

            latestVersion,

            versionCode:
              data.versionCode,

            forceUpdate:
              Boolean(
                data.forceUpdate
              ),

            downloadUrl:
              data.downloadUrl,

            playStoreUrl:
              data.playStoreUrl,

            releaseNotes:
              data.releaseNotes ||
              '',

          });


          setVisible(true);

        }

      } catch (error) {

        /*
        |--------------------------------------------------------------------------
        | Update check should NEVER crash the app
        |--------------------------------------------------------------------------
        */

        console.log(
          'Veda update check failed:',
          error?.response?.data ||
          error?.message ||
          error
        );

      } finally {

        setChecking(false);

      }

    }, []);


  /*
  |--------------------------------------------------------------------------
  | Check On App Start
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const timer =
      setTimeout(() => {

        checkForUpdate();

      }, 1500);


    return () => {

      clearTimeout(timer);

    };

  }, [
    checkForUpdate,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Download APK
  |--------------------------------------------------------------------------
  */

  const downloadApk =
    async (downloadUrl) => {

      if (!downloadUrl) {

        throw new Error(
          'APK download URL is missing.'
        );

      }


      /*
      |--------------------------------------------------------------------------
      | Check cache directory
      |--------------------------------------------------------------------------
      */

      const cacheDirectory =
        FileSystem.cacheDirectory;


      if (!cacheDirectory) {

        throw new Error(
          'Android cache directory is unavailable.'
        );

      }


      /*
      |--------------------------------------------------------------------------
      | APK filename
      |--------------------------------------------------------------------------
      */

      const fileName =
        `Veda-${Date.now()}.apk`;


      const fileUri =
        `${cacheDirectory}${fileName}`;


      console.log(
        '--------------------------------'
      );

      console.log(
        'VEDA APK DOWNLOAD'
      );

      console.log(
        'Download URL:',
        downloadUrl
      );

      console.log(
        'Local file:',
        fileUri
      );

      console.log(
        '--------------------------------'
      );


      /*
      |--------------------------------------------------------------------------
      | Download
      |--------------------------------------------------------------------------
      */

      const result =
        await FileSystem.downloadAsync(
          downloadUrl,
          fileUri
        );


      console.log(
        'Veda APK download result:',
        result
      );


      /*
      |--------------------------------------------------------------------------
      | Validate HTTP response
      |--------------------------------------------------------------------------
      */

      if (
        !result ||
        result.status !== 200
      ) {

        throw new Error(
          `APK download failed. HTTP status: ${
            result?.status ||
            'unknown'
          }`
        );

      }


      /*
      |--------------------------------------------------------------------------
      | Verify downloaded file
      |--------------------------------------------------------------------------
      */

      const fileInfo =
        await FileSystem.getInfoAsync(
          result.uri
        );


      console.log(
        'Veda APK file info:',
        fileInfo
      );


      if (
        !fileInfo ||
        !fileInfo.exists
      ) {

        throw new Error(
          'Downloaded APK file does not exist.'
        );

      }


      if (
        fileInfo.size !== undefined &&
        fileInfo.size <= 0
      ) {

        throw new Error(
          'Downloaded APK file is empty.'
        );

      }


      console.log(
        'Veda APK downloaded successfully:',
        result.uri
      );


      return result.uri;

    };


  /*
  |--------------------------------------------------------------------------
  | Install APK
  |--------------------------------------------------------------------------
  */

  const installApk =
    async (apkUri) => {

      if (
        Platform.OS !== 'android'
      ) {
        return;
      }


      if (!apkUri) {

        throw new Error(
          'APK file path is missing.'
        );

      }


      console.log(
        '--------------------------------'
      );

      console.log(
        'VEDA APK INSTALLER'
      );

      console.log(
        'APK URI:',
        apkUri
      );

      console.log(
        '--------------------------------'
      );


      /*
      |--------------------------------------------------------------------------
      | Convert file URI to content URI
      |--------------------------------------------------------------------------
      |
      | Android Package Installer normally needs
      | a content:// URI instead of file:// URI.
      |
      */

      const contentUri =
        await FileSystem.getContentUriAsync(
          apkUri
        );


      console.log(
        'Veda APK content URI:',
        contentUri
      );


      if (!contentUri) {

        throw new Error(
          'Could not create Android content URI.'
        );

      }


      /*
      |--------------------------------------------------------------------------
      | Launch Android Package Installer
      |--------------------------------------------------------------------------
      |
      | INSTALL_PACKAGE tells Android that the
      | selected file is an APK installation package.
      |
      */

      await IntentLauncher.startActivityAsync(
        'android.intent.action.INSTALL_PACKAGE',
        {
          data: contentUri,

          type:
            'application/vnd.android.package-archive',

          flags:
            1 |             // FLAG_GRANT_READ_URI_PERMISSION
            268435456,      // FLAG_ACTIVITY_NEW_TASK
        }
      );


      console.log(
        'Veda Android Package Installer launched.'
      );

    };


  /*
  |--------------------------------------------------------------------------
  | Update Now
  |--------------------------------------------------------------------------
  */

  const handleUpdate =
    async () => {

      if (
        !updateInfo ||
        updating
      ) {
        return;
      }


      try {

        setUpdating(true);


        /*
        |--------------------------------------------------------------------------
        | APK URL
        |--------------------------------------------------------------------------
        */

        const downloadUrl =
          updateInfo.downloadUrl;


        /*
        |--------------------------------------------------------------------------
        | No APK URL
        |--------------------------------------------------------------------------
        */

        if (!downloadUrl) {

          /*
          |--------------------------------------------------------------------------
          | Play Store fallback
          |--------------------------------------------------------------------------
          */

          if (
            updateInfo.playStoreUrl
          ) {

            Alert.alert(
              'Update',
              'Direct APK download is unavailable. Opening Play Store.'
            );


            await Linking.openURL(
              updateInfo.playStoreUrl
            );


            if (
              !updateInfo.forceUpdate
            ) {

              setVisible(false);

            }


            return;

          }


          throw new Error(
            'APK download URL is missing.'
          );

        }


        /*
        |--------------------------------------------------------------------------
        | Download APK
        |--------------------------------------------------------------------------
        */

        const apkUri =
          await downloadApk(
            downloadUrl
          );


        /*
        |--------------------------------------------------------------------------
        | Open Android Installer
        |--------------------------------------------------------------------------
        */

        await installApk(
          apkUri
        );


        /*
        |--------------------------------------------------------------------------
        | Close popup
        |--------------------------------------------------------------------------
        */

        if (
          !updateInfo.forceUpdate
        ) {

          setVisible(false);

        }

      } catch (error) {

        console.log(
          '================================'
        );

        console.log(
          'VEDA APK UPDATE FAILED'
        );

        console.log(
          'Error message:',
          error?.message
        );

        console.log(
          'Error response:',
          error?.response?.data
        );

        console.log(
          'Full error:',
          error
        );

        console.log(
          '================================'
        );


        /*
        |--------------------------------------------------------------------------
        | Show exact error
        |--------------------------------------------------------------------------
        */

        Alert.alert(
          'Update Failed',
          error?.message ||
          'Veda could not download or install the update.',
          [
            {
              text: 'OK',
            },
          ]
        );

      } finally {

        setUpdating(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Later
  |--------------------------------------------------------------------------
  */

  const handleLater =
    () => {

      if (
        updateInfo?.forceUpdate
      ) {
        return;
      }


      setVisible(false);

    };


  /*
  |--------------------------------------------------------------------------
  | Checking
  |--------------------------------------------------------------------------
  */

  if (
    checking &&
    !visible
  ) {

    return null;

  }


  /*
  |--------------------------------------------------------------------------
  | No Update
  |--------------------------------------------------------------------------
  */

  if (
    !visible ||
    !updateInfo
  ) {

    return null;

  }


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (

    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={
        updateInfo.forceUpdate
          ? undefined
          : handleLater
      }
    >

      <View
        style={styles.overlay}
      >

        <View
          style={styles.card}
        >

          {/* Veda Icon */}

          <View
            style={styles.iconContainer}
          >

            <Text
              style={styles.iconText}
            >
              V
            </Text>

          </View>


          {/* Title */}

          <Text
            style={styles.title}
          >
            New Veda Update Available
          </Text>


          {/* Description */}

          <Text
            style={styles.description}
          >
            A new version of Veda is
            available with improvements
            and new features.
          </Text>


          {/* Version */}

          <View
            style={styles.versionBox}
          >

            <View
              style={styles.versionItem}
            >

              <Text
                style={styles.versionLabel}
              >
                Current
              </Text>


              <Text
                style={styles.versionValue}
              >
                {updateInfo.currentVersion}
              </Text>

            </View>


            <Text
              style={styles.arrow}
            >
              →
            </Text>


            <View
              style={styles.versionItem}
            >

              <Text
                style={styles.versionLabel}
              >
                New
              </Text>


              <Text
                style={styles.newVersionValue}
              >
                {updateInfo.latestVersion}
              </Text>

            </View>

          </View>


          {/* Release Notes */}

          {!!updateInfo.releaseNotes && (

            <Text
              style={styles.releaseNotes}
            >
              {updateInfo.releaseNotes}
            </Text>

          )}


          {/* Download Status */}

          {updating && (

            <Text
              style={styles.downloadText}
            >
              Downloading Veda update...
            </Text>

          )}


          {/* Buttons */}

          <View
            style={styles.buttons}
          >

            {!updateInfo.forceUpdate && (

              <Pressable
                style={[
                  styles.button,
                  styles.laterButton,
                ]}
                onPress={
                  handleLater
                }
                disabled={updating}
              >

                <Text
                  style={styles.laterText}
                >
                  Later
                </Text>

              </Pressable>

            )}


            <Pressable
              style={[
                styles.button,
                styles.updateButton,

                updateInfo.forceUpdate &&
                  styles.fullWidthButton,
              ]}
              onPress={
                handleUpdate
              }
              disabled={updating}
            >

              {updating ? (

                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

              ) : (

                <Text
                  style={styles.updateText}
                >
                  Update Now
                </Text>

              )}

            </Pressable>

          </View>


          {/* Force Update Message */}

          {updateInfo.forceUpdate && (

            <Text
              style={styles.requiredText}
            >
              This update is required
              to continue using Veda.
            </Text>

          )}

        </View>

      </View>

    </Modal>

  );

}


/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({

    overlay: {
      flex: 1,

      backgroundColor:
        'rgba(2, 6, 23, 0.72)',

      alignItems: 'center',

      justifyContent: 'center',

      paddingHorizontal: 22,
    },


    card: {
      width: '100%',

      maxWidth: 420,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 24,

      paddingHorizontal: 22,

      paddingTop: 26,

      paddingBottom: 22,

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 12,
      },

      shadowOpacity: 0.22,

      shadowRadius: 30,

      elevation: 16,
    },


    iconContainer: {
      width: 58,

      height: 58,

      borderRadius: 18,

      alignSelf: 'center',

      alignItems: 'center',

      justifyContent: 'center',

      backgroundColor:
        '#0F172A',

      marginBottom: 16,
    },


    iconText: {
      color: '#FFFFFF',

      fontSize: 28,

      fontWeight: '800',

      letterSpacing: -1,
    },


    title: {
      fontSize: 22,

      lineHeight: 28,

      fontWeight: '800',

      color: '#0F172A',

      textAlign: 'center',

      marginBottom: 8,
    },


    description: {
      fontSize: 15,

      lineHeight: 22,

      color: '#64748B',

      textAlign: 'center',

      marginBottom: 18,
    },


    versionBox: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent: 'center',

      backgroundColor:
        '#F8FAFC',

      borderRadius: 16,

      paddingVertical: 14,

      paddingHorizontal: 12,

      marginBottom: 14,
    },


    versionItem: {
      alignItems: 'center',

      minWidth: 85,
    },


    versionLabel: {
      fontSize: 11,

      color: '#94A3B8',

      fontWeight: '700',

      textTransform: 'uppercase',

      letterSpacing: 0.5,

      marginBottom: 4,
    },


    versionValue: {
      fontSize: 16,

      color: '#475569',

      fontWeight: '700',
    },


    newVersionValue: {
      fontSize: 16,

      color: '#0F766E',

      fontWeight: '800',
    },


    arrow: {
      fontSize: 22,

      color: '#94A3B8',

      marginHorizontal: 12,
    },


    releaseNotes: {
      fontSize: 13,

      lineHeight: 19,

      color: '#64748B',

      textAlign: 'center',

      marginBottom: 12,
    },


    downloadText: {
      fontSize: 12,

      color: '#0F766E',

      fontWeight: '700',

      textAlign: 'center',

      marginBottom: 12,
    },


    buttons: {
      flexDirection: 'row',

      gap: 10,
    },


    button: {
      minHeight: 50,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent: 'center',

      paddingHorizontal: 18,
    },


    laterButton: {
      flex: 1,

      backgroundColor:
        '#F1F5F9',
    },


    updateButton: {
      flex: 1.35,

      backgroundColor:
        '#0F172A',
    },


    fullWidthButton: {
      flex: 1,
    },


    laterText: {
      color: '#334155',

      fontSize: 15,

      fontWeight: '700',
    },


    updateText: {
      color: '#FFFFFF',

      fontSize: 15,

      fontWeight: '800',
    },


    requiredText: {
      marginTop: 12,

      textAlign: 'center',

      fontSize: 11,

      lineHeight: 16,

      color: '#EF4444',

      fontWeight: '600',
    },

  });
