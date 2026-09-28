import React, { useEffect, useState } from 'react';

import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import {
  Input,
  Button,
  Card,
  FadeIn,
  Screen,
  colors,
} from '../components/UI';

import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';


// ======================================================
// IMAGE PICKER
// ======================================================

const pickClinicImage = async ({
  type,
  setter,
}) => {
  try {
    // --------------------------------------------------
    // Request permission
    // --------------------------------------------------

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow Veda to access your photo gallery.'
      );

      return;
    }

    // --------------------------------------------------
    // Different crop ratios
    // --------------------------------------------------

    const isLogo = type === 'logo';

    const aspect = isLogo
      ? [1, 1]
      : [16, 6];

    // --------------------------------------------------
    // Open native image picker
    // --------------------------------------------------

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,

        allowsEditing: true,

        aspect,

        quality: 0.8,

        base64: true,

        exif: false,

        allowsMultipleSelection: false,
      });

    // --------------------------------------------------
    // User cancelled
    // --------------------------------------------------

    if (
      result.canceled ||
      !result.assets ||
      !result.assets.length
    ) {
      return;
    }

    const asset = result.assets[0];

    if (!asset?.uri) {
      Alert.alert(
        'Image error',
        'The selected image could not be loaded.'
      );

      return;
    }

    // --------------------------------------------------
    // IMPORTANT
    //
    // ImagePicker's native editor returns the cropped
    // image URI.
    //
    // We additionally resize/compress the final image
    // so the stored profile/banner image is lighter.
    // --------------------------------------------------

    let finalUri = asset.uri;

    try {
      const manipulated =
        await ImageManipulator.manipulateAsync(
          asset.uri,
          isLogo
            ? [
                {
                  resize: {
                    width: 700,
                    height: 700,
                  },
                },
              ]
            : [
                {
                  resize: {
                    width: 1400,
                  },
                },
              ],
          {
            compress: 0.78,
            format:
              ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

      if (manipulated?.base64) {
        setter(
          `data:image/jpeg;base64,${manipulated.base64}`
        );

        return;
      }

      if (manipulated?.uri) {
        finalUri = manipulated.uri;
      }
    } catch (manipulateError) {
      console.log(
        'Image manipulation skipped:',
        manipulateError
      );
    }

    // --------------------------------------------------
    // Fallback
    // --------------------------------------------------

    if (asset.base64) {
      setter(
        `data:image/jpeg;base64,${asset.base64}`
      );

      return;
    }

    setter(finalUri);
  } catch (error) {
    console.log(
      'IMAGE PICKER ERROR:',
      error
    );

    Alert.alert(
      'Image selection failed',
      error?.message ||
        'Unable to select this image. Please try again.'
    );
  }
};


// ======================================================
// PROFILE SCREEN
// ======================================================

export default function Profile() {
  const {
    doctor,
    role,
    logout,
    updateDoctor,
  } = useAuth();

  // ----------------------------------------------------
  // EDIT MODE
  // ----------------------------------------------------

  const [editing, setEditing] =
    useState(false);

  const [busy, setBusy] =
    useState(false);

  // ----------------------------------------------------
  // FORM
  // ----------------------------------------------------

  const [form, setForm] =
    useState({
      ...(doctor || {}),
      password: '',
    });

  // ----------------------------------------------------
  // Whenever doctor context changes,
  // refresh local profile.
  // ----------------------------------------------------

  useEffect(() => {
    if (doctor) {
      setForm({
        ...doctor,
        password: '',
      });
    }
  }, [doctor]);

  // ----------------------------------------------------
  // FORM SETTER
  // ----------------------------------------------------

  const set = (
    key,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };


  // ====================================================
  // SAVE PROFILE
  // ====================================================

  const save = async () => {
    if (busy) return;

    try {
      setBusy(true);

      const data = {
        ...form,
      };

      // Password only if user entered one
      if (!data.password) {
        delete data.password;
      }

      // Remove Mongo internal fields
      delete data._id;
      delete data.__v;
      delete data.createdAt;
      delete data.updatedAt;

      const response =
        await api.put(
          '/auth/profile',
          data
        );

      const updatedDoctor =
        response?.data?.doctor ||
        response?.data?.user ||
        response?.data;

      // ------------------------------------------------
      // Update local auth state
      // ------------------------------------------------

      if (
        updatedDoctor &&
        role !== 'admin'
      ) {
        await updateDoctor(
          updatedDoctor
        );
      }

      if (updatedDoctor) {
        setForm({
          ...updatedDoctor,
          password: '',
        });
      }

      setEditing(false);

      Alert.alert(
        'Profile Updated',
        'Your Veda clinic profile has been updated successfully.'
      );
    } catch (error) {
      console.log(
        'PROFILE SAVE ERROR:',
        error
      );

      Alert.alert(
        'Save failed',
        error?.response?.data?.message ||
          error?.message ||
          'Unable to update your profile.'
      );
    } finally {
      setBusy(false);
    }
  };


  // ====================================================
  // CANCEL EDIT
  // ====================================================

  const cancelEdit = () => {
    setForm({
      ...(doctor || {}),
      password: '',
    });

    setEditing(false);
  };


  // ====================================================
  // PROFILE IMAGE
  // ====================================================

  const changeLogo = () => {
    if (busy) return;

    pickClinicImage({
      type: 'logo',

      setter: (value) => {
        set(
          'clinicLogo',
          value
        );
      },
    });
  };


  // ====================================================
  // BANNER IMAGE
  // ====================================================

  const changeBanner = () => {
    if (busy) return;

    pickClinicImage({
      type: 'banner',

      setter: (value) => {
        set(
          'clinicBanner',
          value
        );
      },
    });
  };


  // ====================================================
  // FIELDS
  // ====================================================

  const keys =
    role === 'admin'
      ? [
          ['name', 'Name'],
          ['email', 'Email'],
        ]
      : [
          ['name', 'Full Name'],
          ['email', 'Email'],
          ['phone', 'Mobile'],
          [
            'qualification',
            'Qualification',
          ],
          [
            'specialization',
            'Specialization',
          ],
          [
            'registrationNumber',
            'Registration Number',
          ],
          [
            'clinicName',
            'Clinic Name',
          ],
          [
            'clinicAddress',
            'Clinic Address',
          ],
          [
            'signature',
            'Signature name / text',
          ],
        ];


  // ====================================================
  // DISPLAY VALUES
  // ====================================================

  const doctorName =
    form?.name ||
    'Doctor name';

  const specialization =
    form?.specialization ||
    'Medical professional';

  const qualification =
    form?.qualification ||
    '';

  const clinicName =
    form?.clinicName ||
    'Your clinic';

  const clinicAddress =
    form?.clinicAddress ||
    'Add your clinic address';

  const initial =
    (
      clinicName ||
      doctorName ||
      'C'
    )
      .trim()
      .charAt(0)
      .toUpperCase();


  // ====================================================
  // UI
  // ====================================================

  return (
    <Screen scroll>
      <FadeIn>

        {/* =================================================
            PREMIUM PROFILE HERO
        ================================================== */}

        <View style={styles.hero}>

          {/* ---------------------------------------------
              COVER
          ---------------------------------------------- */}

          {form?.clinicBanner ? (
            <Image
              source={{
                uri: form.clinicBanner,
              }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverFallback}>

              <View style={styles.coverGlow} />

              <Text style={styles.coverEyebrow}>
                VEDA
              </Text>

              <Text style={styles.coverTitle}>
                CLINIC PROFILE
              </Text>

              <Text
                style={styles.coverSubtitle}
              >
                Professional medical workspace
              </Text>

            </View>
          )}

          {/* ---------------------------------------------
              COVER DARK OVERLAY
          ---------------------------------------------- */}

          <View
            pointerEvents="none"
            style={styles.coverOverlay}
          />

          {/* ---------------------------------------------
              EDIT COVER
              ONLY IN EDIT MODE
          ---------------------------------------------- */}

          {editing && (
            <Pressable
              onPress={changeBanner}
              disabled={busy}
              style={({ pressed }) => [
                styles.editCoverButton,
                pressed &&
                  styles.pressed,
                busy &&
                  styles.disabled,
              ]}
            >
              <Text
                style={
                  styles.editCoverIcon
                }
              >
                ✦
              </Text>

              <Text
                style={
                  styles.editCoverText
                }
              >
                Change cover
              </Text>
            </Pressable>
          )}

          {/* ---------------------------------------------
              CLINIC LOGO
          ---------------------------------------------- */}

          <View style={styles.logoOuter}>

            <View style={styles.logoInner}>

              {form?.clinicLogo ? (
                <Image
                  source={{
                    uri: form.clinicLogo,
                  }}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.logoInitial}>
                  {initial}
                </Text>
              )}

            </View>

          </View>

          {/* ---------------------------------------------
              EDIT DP
              ONLY IN EDIT MODE
          ---------------------------------------------- */}

          {editing && (
            <Pressable
              onPress={changeLogo}
              disabled={busy}
              style={({ pressed }) => [
                styles.editLogoButton,
                pressed &&
                  styles.pressed,
                busy &&
                  styles.disabled,
              ]}
            >
              <Text
                style={styles.editLogoIcon}
              >
                ✦
              </Text>

              <Text
                style={styles.editLogoText}
              >
                Change photo
              </Text>
            </Pressable>
          )}

        </View>


        {/* =================================================
            IDENTITY SECTION
        ================================================== */}

        <View style={styles.identity}>

          <View style={styles.identityText}>

            <View
              style={
                styles.verifiedRow
              }
            >
              <Text
                style={
                  styles.identityName
                }
              >
                {doctorName}
              </Text>

              <View
                style={
                  styles.verifiedBadge
                }
              >
                <Text
                  style={
                    styles.verifiedText
                  }
                >
                  ✓
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.identitySpecialization
              }
            >
              {specialization}

              {qualification
                ? `  ·  ${qualification}`
                : ''}
            </Text>

            <View
              style={
                styles.addressRow
              }
            >
              <Text
                style={
                  styles.addressIcon
                }
              >
                ⌖
              </Text>

              <Text
                style={
                  styles.identityAddress
                }
                numberOfLines={2}
              >
                {clinicAddress}
              </Text>
            </View>

          </View>

        </View>


        {/* =================================================
            ACTION BAR
        ================================================== */}

        <View style={styles.actionBar}>

          {!editing ? (
            <Pressable
              onPress={() =>
                setEditing(true)
              }
              style={({ pressed }) => [
                styles.primaryAction,
                pressed &&
                  styles.primaryActionPressed,
              ]}
            >
              <Text
                style={
                  styles.primaryActionIcon
                }
              >
                ✎
              </Text>

              <Text
                style={
                  styles.primaryActionText
                }
              >
                Edit Profile
              </Text>

              <Text
                style={
                  styles.primaryActionArrow
                }
              >
                →
              </Text>
            </Pressable>
          ) : (
            <View
              style={
                styles.editActions
              }
            >

              <Pressable
                onPress={cancelEdit}
                disabled={busy}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed &&
                    styles.cancelPressed,
                  busy &&
                    styles.disabled,
                ]}
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={save}
                disabled={busy}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed &&
                    styles.savePressed,
                  busy &&
                    styles.disabled,
                ]}
              >
                {busy ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Text
                      style={
                        styles.saveIcon
                      }
                    >
                      ✓
                    </Text>

                    <Text
                      style={
                        styles.saveText
                      }
                    >
                      Save Changes
                    </Text>
                  </>
                )}
              </Pressable>

            </View>
          )}

        </View>


        {/* =================================================
            VIEW MODE
        ================================================== */}

        {!editing && (
          <>

            {/* ---------------------------------------------
                CLINIC CARD
            ---------------------------------------------- */}

            <Card accent>

              <View
                style={
                  styles.sectionHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.sectionEyebrow
                    }
                  >
                    PROFESSIONAL PROFILE
                  </Text>

                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    {clinicName}
                  </Text>
                </View>

                <View
                  style={
                    styles.sectionSymbol
                  }
                >
                  <Text
                    style={
                      styles.sectionSymbolText
                    }
                  >
                    ✦
                  </Text>
                </View>
              </View>


              <View
                style={
                  styles.infoGrid
                }
              >

                <InfoItem
                  label="Specialization"
                  value={
                    specialization
                  }
                />

                <InfoItem
                  label="Qualification"
                  value={
                    qualification ||
                    'Not added'
                  }
                />

                <InfoItem
                  label="Registration"
                  value={
                    form?.registrationNumber ||
                    'Not added'
                  }
                />

                <InfoItem
                  label="Mobile"
                  value={
                    form?.phone ||
                    'Not added'
                  }
                />

              </View>


              <View
                style={
                  styles.addressCard
                }
              >
                <Text
                  style={
                    styles.addressCardIcon
                  }
                >
                  ⌖
                </Text>

                <View
                  style={
                    styles.addressCardContent
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    CLINIC ADDRESS
                  </Text>

                  <Text
                    style={
                      styles.addressValue
                    }
                  >
                    {clinicAddress}
                  </Text>
                </View>
              </View>


              {form?.signature && (
                <View
                  style={
                    styles.signatureCard
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    PRESCRIPTION SIGNATURE
                  </Text>

                  <Text
                    style={
                      styles.signatureValue
                    }
                  >
                    {form.signature}
                  </Text>
                </View>
              )}

            </Card>


            {/* ---------------------------------------------
                ACCOUNT CARD
            ---------------------------------------------- */}

            <Card>

              <Text
                style={
                  styles.sectionEyebrow
                }
              >
                ACCOUNT
              </Text>

              <Text
                style={
                  styles.sectionTitleSmall
                }
              >
                Secure Veda account
              </Text>

              <View
                style={
                  styles.accountRow
                }
              >
                <View
                  style={
                    styles.accountIcon
                  }
                >
                  <Text
                    style={
                      styles.accountIconText
                    }
                  >
                    ✓
                  </Text>
                </View>

                <View
                  style={
                    styles.accountText
                  }
                >
                  <Text
                    style={
                      styles.accountTitle
                    }
                  >
                    Account protected
                  </Text>

                  <Text
                    style={
                      styles.accountSubtext
                    }
                  >
                    Your medical workspace is
                    secured by Veda.
                  </Text>
                </View>
              </View>

            </Card>

          </>
        )}


        {/* =================================================
            EDIT MODE
        ================================================== */}

        {editing && (
          <Card accent>

            <View
              style={
                styles.editHeader
              }
            >
              <View>

                <Text
                  style={
                    styles.sectionEyebrow
                  }
                >
                  EDITING PROFILE
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Professional details
                </Text>

              </View>

              <View
                style={
                  styles.editingBadge
                }
              >
                <Text
                  style={
                    styles.editingBadgeText
                  }
                >
                  EDIT
                </Text>
              </View>
            </View>


            {keys.map(
              ([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  value={
                    form?.[key] || ''
                  }
                  onChangeText={(
                    value
                  ) =>
                    set(
                      key,
                      value
                    )
                  }
                  autoCapitalize={
                    key === 'email'
                      ? 'none'
                      : 'sentences'
                  }
                  editable={!busy}
                />
              )
            )}


            <Input
              label="New Password"
              value={
                form?.password || ''
              }
              onChangeText={(
                value
              ) =>
                set(
                  'password',
                  value
                )
              }
              secureTextEntry
              editable={!busy}
            />


            {/* -------------------------------------------
                SAVE BUTTON
            -------------------------------------------- */}

            <Button
              title={
                busy
                  ? 'Saving profile...'
                  : 'Save profile'
              }
              onPress={save}
              disabled={busy}
            />

          </Card>
        )}


        {/* =================================================
            SIGN OUT
        ================================================== */}

        <View
          style={
            styles.signOutWrapper
          }
        >
          <Button
            title="Sign out"
            secondary
            onPress={logout}
            disabled={busy}
          />
        </View>


        {/* =================================================
            SECURITY FOOTER
        ================================================== */}

        <View
          style={
            styles.securityFooter
          }
        >

          <Text
            style={
              styles.securityIcon
            }
          >
            ◉
          </Text>

          <Text
            style={
              styles.securityText
            }
          >
            VEDA • Secure Medical Workspace
          </Text>

        </View>

      </FadeIn>
    </Screen>
  );
}


// ======================================================
// INFO ITEM
// ======================================================

function InfoItem({
  label,
  value,
}) {
  return (
    <View style={styles.infoItem}>

      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.infoValue
        }
        numberOfLines={2}
      >
        {value}
      </Text>

    </View>
  );
}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  hero: {
    height: 235,
    borderRadius: 26,
    overflow: 'visible',
    backgroundColor: '#10233F',
    marginBottom: 72,
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },

  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },

  coverFallback: {
    flex: 1,
    borderRadius: 26,
    padding: 26,
    justifyContent: 'center',
    overflow: 'hidden',
  },

  coverGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -80,
    top: -90,
    backgroundColor: 'rgba(20,184,166,0.18)',
  },

  coverEyebrow: {
    color: '#8CE8DD',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 4,
  },

  coverTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 9,
    letterSpacing: 1,
  },

  coverSubtitle: {
    color: '#AFC1D8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 7,
  },

  coverOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 26,
    backgroundColor: 'rgba(7,17,32,0.12)',
  },

  editCoverButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: 'rgba(4,12,24,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  editCoverIcon: {
    color: '#8CE8DD',
    fontSize: 13,
    marginRight: 6,
  },

  editCoverText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  logoOuter: {
    position: 'absolute',
    left: 22,
    bottom: -57,
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.18,
    shadowRadius: 13,
    elevation: 10,
  },

  logoInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    overflow: 'hidden',
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoImage: {
    width: '100%',
    height: '100%',
  },

  logoInitial: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
  },

  editLogoButton: {
    position: 'absolute',
    left: 103,
    bottom: -45,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 5,
  },

  editLogoIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    marginRight: 5,
  },

  editLogoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  disabled: {
    opacity: 0.55,
  },

  identity: {
    paddingHorizontal: 5,
    marginBottom: 18,
  },

  identityText: {
    paddingLeft: 0,
  },

  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  identityName: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  verifiedBadge: {
    width: 21,
    height: 21,
    borderRadius: 11,
    marginLeft: 8,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  identitySpecialization: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },

  addressIcon: {
    color: colors.cyan,
    fontSize: 17,
    marginRight: 6,
    marginTop: -1,
  },

  identityAddress: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  actionBar: {
    marginBottom: 18,
  },

  primaryAction: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.blue,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.blue,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 5,
  },

  primaryActionPressed: {
    opacity: 0.86,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  primaryActionIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 9,
  },

  primaryActionText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  primaryActionArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '400',
  },

  editActions: {
    flexDirection: 'row',
    gap: 9,
  },

  cancelButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelPressed: {
    backgroundColor: '#F1F5F9',
  },

  cancelText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '900',
  },

  saveButton: {
    flex: 1.7,
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  savePressed: {
    opacity: 0.84,
  },

  saveIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginRight: 7,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 21,
  },

  sectionEyebrow: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 5,
  },

  sectionTitleSmall: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 5,
    marginBottom: 18,
  },

  sectionSymbol: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFEFA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionSymbolText: {
    color: colors.cyan,
    fontSize: 17,
    fontWeight: '900',
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },

  infoItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 20,
  },

  infoLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  infoValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
    lineHeight: 18,
  },

  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  addressCardIcon: {
    color: colors.cyan,
    fontSize: 19,
    marginRight: 10,
  },

  addressCardContent: {
    flex: 1,
  },

  addressValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 5,
  },

  signatureCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  signatureValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 7,
    fontStyle: 'italic',
  },

  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#ECFEFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  accountIconText: {
    color: colors.cyan,
    fontSize: 17,
    fontWeight: '900',
  },

  accountText: {
    flex: 1,
  },

  accountTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },

  accountSubtext: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  editHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  editingBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },

  editingBadgeText: {
    color: colors.blue,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  signOutWrapper: {
    marginTop: 2,
  },

  securityFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },

  securityIcon: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 5,
  },

  securityText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

});