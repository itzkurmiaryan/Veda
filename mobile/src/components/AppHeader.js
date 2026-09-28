import React, { useEffect, useRef, useState } from 'react';

import {
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';


/* =========================================================
   VEDA LOGO
========================================================= */

const VEDA_LOGO = require('../../assets/veda.png');


/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  black: '#030712',

  navy: '#071426',
  navy2: '#0A192D',
  navy3: '#10243E',

  white: '#FFFFFF',
  softWhite: '#F8FAFC',

  blue: '#2563EB',
  blue2: '#3B82F6',

  cyan: '#14B8A6',
  cyanLight: '#5EEAD4',

  text: '#E2E8F0',
  muted: '#94A3B8',
  mutedDark: '#64748B',

  border: 'rgba(255,255,255,0.085)',
  borderStrong: 'rgba(255,255,255,0.15)',

  glass: 'rgba(255,255,255,0.045)',
  glassStrong: 'rgba(255,255,255,0.075)',

  active: 'rgba(37,99,235,0.16)',
  activeBorder: 'rgba(59,130,246,0.28)',

  danger: '#FB7185',
  dangerBg: 'rgba(251,113,133,0.075)',
  dangerBorder: 'rgba(251,113,133,0.22)',
};


/* =========================================================
   APP HEADER
========================================================= */

export default function AppHeader() {

  const navigation = useNavigation();
  const route = useRoute();

  const { width } = useWindowDimensions();

  const {
    token,
    doctor,
    role,
    logout,
  } = useAuth();


  /* =======================================================
     RESPONSIVE
  ======================================================= */

  const isMobile = width < 760;
  const isTablet = width >= 760 && width < 1080;


  /* =======================================================
     MENU
======================================================= */

  const [menuOpen, setMenuOpen] = useState(false);

  const menuAnimation = useRef(
    new Animated.Value(0)
  ).current;


  /* =======================================================
     PROFILE ANIMATION
======================================================= */

  const profileAnimation = useRef(
    new Animated.Value(0)
  ).current;


  /* =======================================================
     HAMBURGER ANIMATION
======================================================= */

  const topRotate =
    menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '45deg'],
    });

  const bottomRotate =
    menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '-45deg'],
    });

  const topTranslate =
    menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 7],
    });

  const bottomTranslate =
    menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -7],
    });


  /* =======================================================
     MENU OPEN / CLOSE
======================================================= */

  const openMenu = () => {

    setMenuOpen(true);

    Animated.parallel([

      Animated.timing(
        menuAnimation,
        {
          toValue: 1,
          duration: 280,
          easing: Easing.out(
            Easing.cubic
          ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        profileAnimation,
        {
          toValue: 1,
          duration: 420,
          delay: 70,
          easing: Easing.out(
            Easing.cubic
          ),
          useNativeDriver: true,
        }
      ),

    ]).start();

  };


  const closeMenu = () => {

    Animated.parallel([

      Animated.timing(
        menuAnimation,
        {
          toValue: 0,
          duration: 210,
          easing: Easing.inOut(
            Easing.cubic
          ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        profileAnimation,
        {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }
      ),

    ]).start(() => {

      setMenuOpen(false);

    });

  };


  const toggleMenu = () => {

    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }

  };


  /* =======================================================
     DOCTOR
======================================================= */

  const doctorName =
    doctor?.name ||
    doctor?.fullName ||
    doctor?.doctorName ||
    'Doctor';


  /*
   * IMPORTANT:
   *
   * Profile.jsx stores the profile DP as clinicLogo.
   */

  const doctorPhoto =
    typeof doctor?.clinicLogo === 'string' &&
    doctor.clinicLogo.trim()
      ? doctor.clinicLogo.trim()
      : null;


  const doctorInitial =
    doctorName
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || 'D';


  /* =======================================================
     ROUTES
======================================================= */

  const doctorRoutes = [
    {
      name: 'Dashboard',
      label: 'Home',
      icon: '⌂',
    },
    {
      name: 'Patients',
      label: 'Patients',
      icon: '♙',
    },
    {
      name: 'About',
      label: 'About',
      icon: 'ⓘ',
    },
    {
      name: 'Help',
      label: 'Help',
      icon: '?',
    },
  ];


  const adminRoutes = [
    {
      name: 'AdminDashboard',
      label: 'Dashboard',
      icon: '⌂',
    },
    {
      name: 'About',
      label: 'About',
      icon: 'ⓘ',
    },
    {
      name: 'Help',
      label: 'Help',
      icon: '?',
    },
  ];


  const publicRoutes = [
    {
      name: 'About',
      label: 'About',
      icon: 'ⓘ',
    },
    {
      name: 'Help',
      label: 'Help',
      icon: '?',
    },
  ];


  const routes = token
    ? role === 'admin'
      ? adminRoutes
      : doctorRoutes
    : publicRoutes;


  const currentRouteName =
    route?.name;


  /* =======================================================
     BACK
======================================================= */

  const canGoBack =
    typeof navigation.canGoBack === 'function' &&
    navigation.canGoBack();


  const goBack = () => {

    closeMenu();

    if (
      typeof navigation.canGoBack ===
        'function' &&
      navigation.canGoBack()
    ) {

      navigation.goBack();

    }

  };


  /* =======================================================
     NAVIGATION
======================================================= */

  const goTo = (screen) => {

    closeMenu();

    navigation.navigate(screen);

  };


  const goHome = () => {

    closeMenu();

    navigation.navigate(
      token
        ? role === 'admin'
          ? 'AdminDashboard'
          : 'Dashboard'
        : 'About'
    );

  };


  /* =======================================================
     PROFILE
======================================================= */

  const openProfile = () => {

    closeMenu();

    navigation.navigate('Profile');

  };


  /* =======================================================
     ALPHAARYX
======================================================= */

  const openAlphaAryX = async () => {

    closeMenu();

    try {

      await Linking.openURL(
        'https://alphaaryx.vercel.app/'
      );

    } catch (error) {

      console.log(
        'AlphaAryX error:',
        error
      );

    }

  };


  /* =======================================================
     LOGOUT
======================================================= */

  const handleLogout = async () => {

    closeMenu();

    try {

      await logout();

    } catch (error) {

      console.log(
        'Logout error:',
        error
      );

    }

  };


  /* =======================================================
     AVATAR
======================================================= */

  const renderAvatar = (
    large = false
  ) => {

    if (doctorPhoto) {

      return (
        <Image
          source={{
            uri: doctorPhoto,
          }}
          style={
            large
              ? styles.avatarLargeImage
              : styles.avatarImage
          }
          resizeMode="cover"
        />
      );

    }


    return (
      <Text
        style={
          large
            ? styles.avatarLargeText
            : styles.avatarText
        }
      >
        {doctorInitial}
      </Text>
    );

  };


  /* =======================================================
     DESKTOP / TABLET
======================================================= */

  if (!isMobile) {

    return (
      <SafeAreaView
        edges={['top']}
        style={styles.safeArea}
      >

        <View
          style={[
            styles.header,
            isTablet &&
              styles.tabletHeader,
          ]}
        >

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <View
            style={styles.leftSection}
          >

            {/* BACK */}

            {canGoBack && (
              <Pressable
                onPress={goBack}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed &&
                    styles.backPressed,
                ]}
              >

                <Text
                  style={styles.backIcon}
                >
                  ‹
                </Text>

                {!isTablet && (
                  <Text
                    style={styles.backText}
                  >
                    Back
                  </Text>
                )}

              </Pressable>
            )}


            {/* VEDA LOGO */}

            <Pressable
              onPress={goHome}
              style={({ pressed }) => [
                styles.logoContainer,
                pressed &&
                  styles.logoPressed,
              ]}
            >

              <View
                style={styles.logoGlow}
              />

              <Image
                source={VEDA_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />

            </Pressable>


            {/* BRAND */}

            {!isTablet && (
              <View
                style={styles.brand}
              >

                <Text
                  style={styles.brandName}
                >
                  VEDA
                </Text>

                <View
                  style={styles.brandRow}
                >

                  <View
                    style={styles.brandDot}
                  />

                  <Text
                    style={styles.brandSubtitle}
                  >
                    MEDICAL PRACTICE
                  </Text>

                </View>

              </View>
            )}


            {/* DESKTOP NAV */}

            <View
              style={styles.desktopNav}
            >

              {routes.map(
                (item) => {

                  const active =
                    currentRouteName ===
                    item.name;

                  return (
                    <Pressable
                      key={item.name}
                      onPress={() =>
                        goTo(item.name)
                      }
                      style={({ pressed }) => [
                        styles.desktopNavItem,
                        active &&
                          styles.desktopNavActive,
                        pressed &&
                          styles.desktopNavPressed,
                      ]}
                    >

                      {!isTablet && (
                        <Text
                          style={[
                            styles.navIcon,
                            active &&
                              styles.navIconActive,
                          ]}
                        >
                          {item.icon}
                        </Text>
                      )}

                      <Text
                        style={[
                          styles.desktopNavText,
                          active &&
                            styles.desktopNavTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>

                      {active && (
                        <View
                          style={
                            styles.activeIndicator
                          }
                        />
                      )}

                    </Pressable>
                  );

                }
              )}


              {!isTablet && (
                <Pressable
                  onPress={openAlphaAryX}
                  style={({ pressed }) => [
                    styles.desktopNavItem,
                    pressed &&
                      styles.desktopNavPressed,
                  ]}
                >

                  <Text
                    style={styles.navIcon}
                  >
                    ◈
                  </Text>

                  <Text
                    style={
                      styles.desktopNavText
                    }
                  >
                    AlphaAryX
                  </Text>

                  <Text
                    style={styles.external}
                  >
                    ↗
                  </Text>

                </Pressable>
              )}

            </View>

          </View>


          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <View
            style={styles.rightSection}
          >

            {token ? (
              <>

                {/* NO DOCTOR DP HERE */}

                <View
                  style={styles.secureBadge}
                >

                  <View
                    style={
                      styles.secureDot
                    }
                  />

                  {!isTablet && (
                    <Text
                      style={
                        styles.secureText
                      }
                    >
                      SECURE
                    </Text>
                  )}

                </View>


                {/* THREE LINES */}

                <Pressable
                  onPress={toggleMenu}
                  style={({ pressed }) => [
                    styles.desktopMenuButton,
                    menuOpen &&
                      styles.desktopMenuButtonOpen,
                    pressed &&
                      styles.menuPressed,
                  ]}
                >

                  <View
                    style={styles.menuLines}
                  >

                    <Animated.View
                      style={[
                        styles.menuLine,
                        {
                          transform: [
                            {
                              translateY:
                                topTranslate,
                            },
                            {
                              rotate:
                                topRotate,
                            },
                          ],
                        },
                      ]}
                    />

                    <Animated.View
                      style={[
                        styles.menuLine,
                        {
                          opacity:
                            menuAnimation.interpolate({
                              inputRange: [
                                0,
                                0.5,
                                1,
                              ],
                              outputRange: [
                                1,
                                0,
                                0,
                              ],
                            }),
                        },
                      ]}
                    />

                    <Animated.View
                      style={[
                        styles.menuLine,
                        {
                          transform: [
                            {
                              translateY:
                                bottomTranslate,
                            },
                            {
                              rotate:
                                bottomRotate,
                            },
                          ],
                        },
                      ]}
                    />

                  </View>

                </Pressable>

              </>
            ) : (
              <>

                <Pressable
                  onPress={() =>
                    goTo('Login')
                  }
                  style={({ pressed }) => [
                    styles.signInButton,
                    pressed &&
                      styles.signInPressed,
                  ]}
                >

                  <Text
                    style={styles.signInText}
                  >
                    Sign In
                  </Text>

                </Pressable>


                <Pressable
                  onPress={() =>
                    goTo('Register')
                  }
                  style={({ pressed }) => [
                    styles.registerButton,
                    pressed &&
                      styles.registerPressed,
                  ]}
                >

                  <Text
                    style={
                      styles.registerText
                    }
                  >
                    Register
                  </Text>

                </Pressable>

              </>
            )}

          </View>


          {/* =================================================
              DESKTOP DROPDOWN
          ================================================= */}

          {token && menuOpen && (
            <Animated.View
              style={[
                styles.desktopDropdown,
                {
                  opacity:
                    menuAnimation,
                  transform: [
                    {
                      translateY:
                        menuAnimation.interpolate({
                          inputRange: [
                            0,
                            1,
                          ],
                          outputRange: [
                            -14,
                            0,
                          ],
                        }),
                    },
                    {
                      scale:
                        menuAnimation.interpolate({
                          inputRange: [
                            0,
                            1,
                          ],
                          outputRange: [
                            0.97,
                            1,
                          ],
                        }),
                    },
                  ],
                },
              ]}
            >

              {/* PROFILE */}

              <Pressable
                onPress={openProfile}
                style={({ pressed }) => [
                  styles.dropdownProfile,
                  pressed &&
                    styles.dropdownProfilePressed,
                ]}
              >

                <View
                  style={styles.largeAvatar}
                >
                  {renderAvatar(true)}
                </View>


                <View
                  style={
                    styles.dropdownProfileInfo
                  }
                >

                  <Text
                    numberOfLines={1}
                    style={
                      styles.dropdownName
                    }
                  >
                    {doctorName}
                  </Text>

                  <View
                    style={styles.dropdownRoleRow}
                  >

                    <View
                      style={
                        styles.dropdownOnline
                      }
                    />

                    <Text
                      style={
                        styles.dropdownRole
                      }
                    >
                      {role === 'admin'
                        ? 'Administrator'
                        : 'Doctor'}
                    </Text>

                  </View>

                  <Text
                    style={
                      styles.dropdownHint
                    }
                  >
                    View & edit profile
                  </Text>

                </View>


                <Text
                  style={
                    styles.dropdownArrow
                  }
                >
                  →
                </Text>

              </Pressable>


              {/* SEPARATOR */}

              <View
                style={
                  styles.dropdownSeparator
                }
              />


              {/* MENU LINKS */}

              {routes.map(
                (item) => {

                  const active =
                    currentRouteName ===
                    item.name;

                  return (
                    <Pressable
                      key={item.name}
                      onPress={() =>
                        goTo(item.name)
                      }
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        active &&
                          styles.dropdownItemActive,
                        pressed &&
                          styles.dropdownItemPressed,
                      ]}
                    >

                      <View
                        style={
                          styles.dropdownIconBox
                        }
                      >

                        <Text
                          style={[
                            styles.dropdownIcon,
                            active &&
                              styles.dropdownIconActive,
                          ]}
                        >
                          {item.icon}
                        </Text>

                      </View>


                      <Text
                        style={[
                          styles.dropdownItemText,
                          active &&
                            styles.dropdownItemTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>


                      {active && (
                        <View
                          style={
                            styles.dropdownActiveDot
                          }
                        />
                      )}

                    </Pressable>
                  );

                }
              )}


              {/* ALPHAARYX */}

              <Pressable
                onPress={openAlphaAryX}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  pressed &&
                    styles.dropdownItemPressed,
                ]}
              >

                <View
                  style={
                    styles.dropdownIconBox
                  }
                >

                  <Text
                    style={
                      styles.dropdownIcon
                    }
                  >
                    ◈
                  </Text>

                </View>

                <Text
                  style={
                    styles.dropdownItemText
                  }
                >
                  AlphaAryX
                </Text>

                <Text
                  style={
                    styles.dropdownExternal
                  }
                >
                  ↗
                </Text>

              </Pressable>


              {/* LOGOUT */}

              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.dropdownLogout,
                  pressed &&
                    styles.dropdownLogoutPressed,
                ]}
              >

                <Text
                  style={
                    styles.dropdownLogoutIcon
                  }
                >
                  ⎋
                </Text>

                <Text
                  style={
                    styles.dropdownLogoutText
                  }
                >
                  Sign Out
                </Text>

              </Pressable>


              {/* FOOTER */}

              <View
                style={
                  styles.dropdownFooter
                }
              >

                <View
                  style={
                    styles.footerDot
                  }
                />

                <Text
                  style={
                    styles.footerText
                  }
                >
                  VEDA • SECURE MEDICAL PRACTICE
                </Text>

              </View>

            </Animated.View>
          )}

        </View>

      </SafeAreaView>
    );

  }


  /* =======================================================
     MOBILE
======================================================= */

  return (
    <SafeAreaView
      edges={['top']}
      style={styles.safeArea}
    >

      <View
        style={styles.mobileHeader}
      >

        {/* =================================================
            TOP BAR
        ================================================= */}

        <View
          style={styles.mobileTopBar}
        >

          {/* LEFT */}

          <View
            style={styles.mobileLeft}
          >

            {canGoBack && (
              <Pressable
                onPress={goBack}
                style={({ pressed }) => [
                  styles.mobileBack,
                  pressed &&
                    styles.mobilePressed,
                ]}
              >

                <Text
                  style={
                    styles.mobileBackIcon
                  }
                >
                  ‹
                </Text>

              </Pressable>
            )}


            <Pressable
              onPress={goHome}
              style={({ pressed }) => [
                styles.mobileLogo,
                pressed &&
                  styles.logoPressed,
              ]}
            >

              <Image
                source={VEDA_LOGO}
                style={
                  styles.mobileLogoImage
                }
                resizeMode="contain"
              />

            </Pressable>


            <View
              style={styles.mobileBrand}
            >

              <Text
                style={
                  styles.mobileBrandName
                }
              >
                VEDA
              </Text>

              <Text
                style={
                  styles.mobileBrandSub
                }
              >
                MEDICAL PRACTICE
              </Text>

            </View>

          </View>


          {/* RIGHT */}

          <View
            style={styles.mobileRight}
          >

            {/* NO DP HERE */}

            {token && (
              <View
                style={
                  styles.mobileSecure
                }
              >

                <View
                  style={
                    styles.mobileSecureDot
                  }
                />

              </View>
            )}


            {/* THREE LINES */}

            <Pressable
              onPress={toggleMenu}
              style={({ pressed }) => [
                styles.mobileMenuButton,
                menuOpen &&
                  styles.mobileMenuButtonOpen,
                pressed &&
                  styles.mobilePressed,
              ]}
            >

              <View
                style={styles.menuLines}
              >

                <Animated.View
                  style={[
                    styles.menuLine,
                    {
                      transform: [
                        {
                          translateY:
                            topTranslate,
                        },
                        {
                          rotate:
                            topRotate,
                        },
                      ],
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.menuLine,
                    {
                      opacity:
                        menuAnimation.interpolate({
                          inputRange: [
                            0,
                            0.5,
                            1,
                          ],
                          outputRange: [
                            1,
                            0,
                            0,
                          ],
                        }),
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.menuLine,
                    {
                      transform: [
                        {
                          translateY:
                            bottomTranslate,
                        },
                        {
                          rotate:
                            bottomRotate,
                        },
                      ],
                    },
                  ]}
                />

              </View>

            </Pressable>

          </View>

        </View>


        {/* =================================================
            MOBILE MENU
        ================================================= */}

        {token && menuOpen && (
          <Animated.View
            style={[
              styles.mobileMenu,
              {
                opacity:
                  menuAnimation,
                transform: [
                  {
                    translateY:
                      menuAnimation.interpolate({
                        inputRange: [
                          0,
                          1,
                        ],
                        outputRange: [
                          -15,
                          0,
                        ],
                      }),
                  },
                ],
              },
            ]}
          >

            {/* PROFILE CARD */}

            <Animated.View
              style={{
                opacity:
                  profileAnimation,
                transform: [
                  {
                    translateY:
                      profileAnimation.interpolate({
                        inputRange: [
                          0,
                          1,
                        ],
                        outputRange: [
                          12,
                          0,
                        ],
                      }),
                  },
                ],
              }}
            >

              <Pressable
                onPress={openProfile}
                style={({ pressed }) => [
                  styles.mobileProfile,
                  pressed &&
                    styles.mobileProfilePressed,
                ]}
              >

                <View
                  style={
                    styles.mobileLargeAvatar
                  }
                >
                  {renderAvatar(true)}
                </View>


                <View
                  style={
                    styles.mobileProfileInfo
                  }
                >

                  <Text
                    numberOfLines={1}
                    style={
                      styles.mobileProfileName
                    }
                  >
                    {doctorName}
                  </Text>

                  <View
                    style={
                      styles.mobileRoleRow
                    }
                  >

                    <View
                      style={
                        styles.mobileOnlineDot
                      }
                    />

                    <Text
                      style={
                        styles.mobileProfileRole
                      }
                    >
                      {role === 'admin'
                        ? 'Administrator'
                        : 'Doctor'}
                    </Text>

                  </View>

                  <Text
                    style={
                      styles.mobileProfileHint
                    }
                  >
                    Tap to view profile
                  </Text>

                </View>


                <Text
                  style={
                    styles.mobileProfileArrow
                  }
                >
                  →
                </Text>

              </Pressable>

            </Animated.View>


            {/* NAVIGATION */}

            <View
              style={styles.mobileNavigation}
            >

              {routes.map(
                (item, index) => {

                  const active =
                    currentRouteName ===
                    item.name;

                  return (
                    <Animated.View
                      key={item.name}
                      style={{
                        opacity:
                          menuAnimation,
                        transform: [
                          {
                            translateX:
                              menuAnimation.interpolate({
                                inputRange: [
                                  0,
                                  1,
                                ],
                                outputRange: [
                                  15 +
                                    index *
                                      3,
                                  0,
                                ],
                              }),
                          },
                        ],
                      }}
                    >

                      <Pressable
                        onPress={() =>
                          goTo(item.name)
                        }
                        style={({ pressed }) => [
                          styles.mobileNavItem,
                          active &&
                            styles.mobileNavActive,
                          pressed &&
                            styles.mobileNavPressed,
                        ]}
                      >

                        <View
                          style={
                            styles.mobileNavLeft
                          }
                        >

                          <View
                            style={[
                              styles.mobileIconBox,
                              active &&
                                styles.mobileIconBoxActive,
                            ]}
                          >

                            <Text
                              style={[
                                styles.mobileNavIcon,
                                active &&
                                  styles.mobileNavIconActive,
                              ]}
                            >
                              {item.icon}
                            </Text>

                          </View>


                          <Text
                            style={[
                              styles.mobileNavText,
                              active &&
                                styles.mobileNavTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>

                        </View>


                        <Text
                          style={[
                            styles.mobileArrow,
                            active &&
                              styles.mobileArrowActive,
                          ]}
                        >
                          →
                        </Text>

                      </Pressable>

                    </Animated.View>
                  );

                }
              )}


              {/* ALPHAARYX */}

              <Pressable
                onPress={openAlphaAryX}
                style={({ pressed }) => [
                  styles.mobileNavItem,
                  pressed &&
                    styles.mobileNavPressed,
                ]}
              >

                <View
                  style={
                    styles.mobileNavLeft
                  }
                >

                  <View
                    style={styles.mobileIconBox}
                  >

                    <Text
                      style={
                        styles.mobileNavIcon
                      }
                    >
                      ◈
                    </Text>

                  </View>

                  <Text
                    style={
                      styles.mobileNavText
                    }
                  >
                    AlphaAryX
                  </Text>

                </View>


                <Text
                  style={
                    styles.mobileExternal
                  }
                >
                  ↗
                </Text>

              </Pressable>

            </View>


            {/* LOGOUT */}

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.mobileLogout,
                pressed &&
                  styles.mobileLogoutPressed,
              ]}
            >

              <Text
                style={
                  styles.mobileLogoutIcon
                }
              >
                ⎋
              </Text>

              <Text
                style={
                  styles.mobileLogoutText
                }
              >
                Sign Out
              </Text>

            </Pressable>


            {/* FOOTER */}

            <View
              style={
                styles.mobileFooter
              }
            >

              <View
                style={
                  styles.mobileFooterDot
                }
              />

              <Text
                style={
                  styles.mobileFooterText
                }
              >
                VEDA
              </Text>

              <Text
                style={
                  styles.mobileFooterSub
                }
              >
                Secure Medical Practice
              </Text>

            </View>

          </Animated.View>
        )}


        {/* =================================================
            PUBLIC MOBILE MENU
        ================================================= */}

        {!token && menuOpen && (
          <Animated.View
            style={[
              styles.mobileMenu,
              {
                opacity:
                  menuAnimation,
              },
            ]}
          >

            <View
              style={
                styles.publicWelcome
              }
            >

              <View
                style={
                  styles.publicLogoCircle
                }
              >

                <Image
                  source={VEDA_LOGO}
                  style={
                    styles.publicLogo
                  }
                  resizeMode="contain"
                />

              </View>

              <Text
                style={
                  styles.publicTitle
                }
              >
                Welcome to VEDA
              </Text>

              <Text
                style={
                  styles.publicSubtitle
                }
              >
                Secure medical practice management
              </Text>

            </View>


            <View
              style={
                styles.mobileNavigation
              }
            >

              {routes.map(
                (item) => {

                  const active =
                    currentRouteName ===
                    item.name;

                  return (
                    <Pressable
                      key={item.name}
                      onPress={() =>
                        goTo(item.name)
                      }
                      style={({ pressed }) => [
                        styles.mobileNavItem,
                        active &&
                          styles.mobileNavActive,
                        pressed &&
                          styles.mobileNavPressed,
                      ]}
                    >

                      <View
                        style={
                          styles.mobileNavLeft
                        }
                      >

                        <View
                          style={
                            styles.mobileIconBox
                          }
                        >

                          <Text
                            style={
                              styles.mobileNavIcon
                            }
                          >
                            {item.icon}
                          </Text>

                        </View>

                        <Text
                          style={
                            styles.mobileNavText
                          }
                        >
                          {item.label}
                        </Text>

                      </View>

                      <Text
                        style={
                          styles.mobileArrow
                        }
                      >
                        →
                      </Text>

                    </Pressable>
                  );

                }
              )}

            </View>


            <View
              style={
                styles.mobileAuth
              }
            >

              <Pressable
                onPress={() =>
                  goTo('Login')
                }
                style={({ pressed }) => [
                  styles.mobileSignIn,
                  pressed &&
                    styles.mobilePressed,
                ]}
              >

                <Text
                  style={
                    styles.mobileSignInText
                  }
                >
                  Sign In
                </Text>

              </Pressable>


              <Pressable
                onPress={() =>
                  goTo('Register')
                }
                style={({ pressed }) => [
                  styles.mobileRegister,
                  pressed &&
                    styles.registerPressed,
                ]}
              >

                <Text
                  style={
                    styles.mobileRegisterText
                  }
                >
                  Create Account
                </Text>

              </Pressable>

            </View>

          </Animated.View>
        )}

      </View>

    </SafeAreaView>
  );

}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  safeArea: {
    backgroundColor: COLORS.black,
  },


  /* =======================================================
     DESKTOP HEADER
  ======================================================= */

  header: {
    minHeight: 76,

    paddingHorizontal: 20,

    backgroundColor: COLORS.navy,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,

    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 9,

    position: 'relative',
    zIndex: 100,
  },

  tabletHeader: {
    paddingHorizontal: 14,
  },


  leftSection: {
    flex: 1,

    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',
  },

  rightSection: {
    flexShrink: 0,

    flexDirection: 'row',
    alignItems: 'center',

    marginLeft: 12,
  },


  /* =======================================================
     BACK
  ======================================================= */

  backButton: {
    height: 42,

    paddingHorizontal: 9,

    marginRight: 7,

    borderRadius: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.045)',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  backPressed: {
    backgroundColor:
      'rgba(255,255,255,0.11)',
  },

  backIcon: {
    color: COLORS.white,

    fontSize: 31,
    lineHeight: 31,

    fontWeight: '300',

    marginTop: -3,
  },

  backText: {
    color: COLORS.muted,

    fontSize: 11,
    fontWeight: '800',

    marginLeft: 2,
  },


  /* =======================================================
     LOGO
  ======================================================= */

  logoContainer: {
    width: 49,
    height: 49,

    borderRadius: 15,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'visible',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.7)',

    marginRight: 10,

    shadowColor: COLORS.cyan,
    shadowOpacity: 0.20,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 6,
  },

  logoGlow: {
    position: 'absolute',

    width: 55,
    height: 55,

    borderRadius: 28,

    backgroundColor:
      'rgba(20,184,166,0.08)',
  },

  logoImage: {
    width: 39,
    height: 39,

    zIndex: 2,
  },

  logoPressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.95,
      },
    ],
  },


  /* =======================================================
     BRAND
  ======================================================= */

  brand: {
    justifyContent: 'center',

    marginRight: 19,

    minWidth: 102,
  },

  brandName: {
    color: COLORS.white,

    fontSize: 15,
    fontWeight: '900',

    letterSpacing: 2,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 3,
  },

  brandDot: {
    width: 4,
    height: 4,

    borderRadius: 2,

    backgroundColor: COLORS.cyanLight,

    marginRight: 5,
  },

  brandSubtitle: {
    color: COLORS.mutedDark,

    fontSize: 7,
    fontWeight: '800',

    letterSpacing: 0.7,
  },


  /* =======================================================
     DESKTOP NAV
  ======================================================= */

  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',

    minWidth: 0,
  },

  desktopNavItem: {
    height: 43,

    paddingHorizontal: 10,

    marginRight: 3,

    borderRadius: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    position: 'relative',
  },

  desktopNavActive: {
    backgroundColor: COLORS.active,

    borderWidth: 1,
    borderColor: COLORS.activeBorder,
  },

  desktopNavPressed: {
    opacity: 0.70,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  navIcon: {
    color: COLORS.mutedDark,

    fontSize: 13,

    marginRight: 5,
  },

  navIconActive: {
    color: COLORS.cyanLight,
  },

  desktopNavText: {
    color: COLORS.muted,

    fontSize: 11,
    fontWeight: '800',
  },

  desktopNavTextActive: {
    color: COLORS.white,
  },

  activeIndicator: {
    position: 'absolute',

    bottom: 3,

    width: 17,
    height: 2,

    borderRadius: 2,

    backgroundColor: COLORS.cyanLight,

    shadowColor: COLORS.cyanLight,
    shadowOpacity: 0.7,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  external: {
    color: COLORS.mutedDark,

    fontSize: 10,

    marginLeft: 4,
  },


  /* =======================================================
     SECURE BADGE
  ======================================================= */

  secureBadge: {
    height: 35,

    paddingHorizontal: 9,

    marginRight: 7,

    borderRadius: 11,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      'rgba(20,184,166,0.055)',

    borderWidth: 1,
    borderColor:
      'rgba(94,234,212,0.12)',
  },

  secureDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor: COLORS.cyanLight,

    shadowColor: COLORS.cyanLight,
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 0,
    },

    marginRight: 5,
  },

  secureText: {
    color: COLORS.cyanLight,

    fontSize: 7,
    fontWeight: '900',

    letterSpacing: 1,
  },


  /* =======================================================
     MENU BUTTON
  ======================================================= */

  desktopMenuButton: {
    width: 47,
    height: 47,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.055)',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.11)',

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  desktopMenuButtonOpen: {
    backgroundColor:
      'rgba(37,99,235,0.15)',

    borderColor:
      'rgba(59,130,246,0.30)',
  },

  menuPressed: {
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  menuLines: {
    width: 21,
    height: 16,

    alignItems: 'center',
    justifyContent: 'space-between',
  },

  menuLine: {
    width: 21,
    height: 2,

    borderRadius: 2,

    backgroundColor: COLORS.white,
  },


  /* =======================================================
     DESKTOP DROPDOWN
  ======================================================= */

  desktopDropdown: {
    position: 'absolute',

    right: 20,
    top: 69,

    width: 315,

    padding: 10,

    borderRadius: 22,

    backgroundColor: '#0B192C',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.13)',

    shadowColor: '#000',
    shadowOpacity: 0.42,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 14,
    },

    elevation: 16,

    zIndex: 999,
  },


  /* =======================================================
     DROPDOWN PROFILE
  ======================================================= */

  dropdownProfile: {
    minHeight: 82,

    padding: 11,

    borderRadius: 17,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      'rgba(37,99,235,0.095)',

    borderWidth: 1,
    borderColor:
      'rgba(59,130,246,0.22)',
  },

  dropdownProfilePressed: {
    backgroundColor:
      'rgba(37,99,235,0.18)',

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  largeAvatar: {
    width: 56,
    height: 56,

    borderRadius: 28,

    backgroundColor: COLORS.blue,

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',

    borderWidth: 2,
    borderColor:
      'rgba(255,255,255,0.22)',

    marginRight: 12,
  },

  avatarLargeImage: {
    width: '100%',
    height: '100%',
  },

  avatarLargeText: {
    color: COLORS.white,

    fontSize: 21,
    fontWeight: '900',
  },

  dropdownProfileInfo: {
    flex: 1,

    minWidth: 0,
  },

  dropdownName: {
    color: COLORS.white,

    fontSize: 14,
    fontWeight: '900',
  },

  dropdownRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 4,
  },

  dropdownOnline: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor: COLORS.cyanLight,

    marginRight: 5,
  },

  dropdownRole: {
    color: COLORS.cyanLight,

    fontSize: 9,
    fontWeight: '800',
  },

  dropdownHint: {
    color: COLORS.mutedDark,

    fontSize: 8,

    marginTop: 4,
  },

  dropdownArrow: {
    color: COLORS.muted,

    fontSize: 22,
    fontWeight: '300',

    marginLeft: 5,
  },


  /* =======================================================
     DROPDOWN ITEMS
  ======================================================= */

  dropdownSeparator: {
    height: 1,

    backgroundColor: COLORS.border,

    marginVertical: 9,
  },

  dropdownItem: {
    height: 45,

    paddingHorizontal: 7,

    borderRadius: 12,

    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 3,
  },

  dropdownItemActive: {
    backgroundColor: COLORS.active,
  },

  dropdownItemPressed: {
    backgroundColor:
      'rgba(255,255,255,0.07)',
  },

  dropdownIconBox: {
    width: 32,
    height: 32,

    borderRadius: 9,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.045)',

    marginRight: 10,
  },

  dropdownIcon: {
    color: COLORS.muted,

    fontSize: 14,
  },

  dropdownIconActive: {
    color: COLORS.cyanLight,
  },

  dropdownItemText: {
    flex: 1,

    color: COLORS.muted,

    fontSize: 11,
    fontWeight: '800',
  },

  dropdownItemTextActive: {
    color: COLORS.white,
  },

  dropdownActiveDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor: COLORS.cyanLight,

    marginRight: 5,
  },

  dropdownExternal: {
    color: COLORS.mutedDark,

    fontSize: 13,

    marginRight: 6,
  },


  /* =======================================================
     DROPDOWN LOGOUT
  ======================================================= */

  dropdownLogout: {
    height: 44,

    marginTop: 5,

    borderRadius: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.dangerBg,

    borderWidth: 1,
    borderColor:
      COLORS.dangerBorder,
  },

  dropdownLogoutPressed: {
    backgroundColor:
      'rgba(251,113,133,0.16)',
  },

  dropdownLogoutIcon: {
    color: COLORS.danger,

    fontSize: 16,

    marginRight: 7,
  },

  dropdownLogoutText: {
    color: COLORS.danger,

    fontSize: 10,
    fontWeight: '900',

    letterSpacing: 0.3,
  },


  /* =======================================================
     DROPDOWN FOOTER
  ======================================================= */

  dropdownFooter: {
    alignItems: 'center',

    paddingTop: 11,
    paddingBottom: 3,

    flexDirection: 'row',
    justifyContent: 'center',
  },

  footerDot: {
    width: 4,
    height: 4,

    borderRadius: 2,

    backgroundColor: COLORS.cyanLight,

    marginRight: 5,
  },

  footerText: {
    color: COLORS.mutedDark,

    fontSize: 7,
    fontWeight: '800',

    letterSpacing: 0.5,
  },


  /* =======================================================
     DESKTOP AUTH
  ======================================================= */

  signInButton: {
    height: 42,

    paddingHorizontal: 14,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  signInPressed: {
    backgroundColor:
      'rgba(255,255,255,0.07)',
  },

  signInText: {
    color: COLORS.white,

    fontSize: 11,
    fontWeight: '900',
  },

  registerButton: {
    height: 42,

    paddingHorizontal: 16,

    marginLeft: 5,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.blue,

    shadowColor: COLORS.blue,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },

  registerPressed: {
    opacity: 0.80,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  registerText: {
    color: COLORS.white,

    fontSize: 11,
    fontWeight: '900',
  },


  /* =======================================================
     MOBILE
  ======================================================= */

  mobileHeader: {
    backgroundColor: COLORS.navy,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,

    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 17,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 9,

    zIndex: 100,
  },

  mobileTopBar: {
    minHeight: 68,

    paddingHorizontal: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mobileLeft: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',
  },

  mobileRight: {
    flexShrink: 0,

    flexDirection: 'row',
    alignItems: 'center',
  },


  /* =======================================================
     MOBILE BACK
  ======================================================= */

  mobileBack: {
    width: 38,
    height: 43,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 2,
  },

  mobileBackIcon: {
    color: COLORS.white,

    fontSize: 34,
    lineHeight: 34,

    fontWeight: '300',

    marginTop: -4,
  },


  /* =======================================================
     MOBILE LOGO
  ======================================================= */

  mobileLogo: {
    width: 44,
    height: 44,

    borderRadius: 13,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.7)',

    shadowColor: COLORS.cyan,
    shadowOpacity: 0.18,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 5,
  },

  mobileLogoImage: {
    width: 36,
    height: 36,
  },

  mobileBrand: {
    marginLeft: 8,

    minWidth: 0,
  },

  mobileBrandName: {
    color: COLORS.white,

    fontSize: 13,
    fontWeight: '900',

    letterSpacing: 1.8,
  },

  mobileBrandSub: {
    color: COLORS.mutedDark,

    fontSize: 7,
    fontWeight: '800',

    marginTop: 2,

    letterSpacing: 0.5,
  },


  /* =======================================================
     MOBILE SECURE
  ======================================================= */

  mobileSecure: {
    width: 20,
    height: 30,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 4,
  },

  mobileSecureDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor: COLORS.cyanLight,

    shadowColor: COLORS.cyanLight,
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },


  /* =======================================================
     MOBILE MENU BUTTON
  ======================================================= */

  mobileMenuButton: {
    width: 44,
    height: 44,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.055)',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.11)',
  },

  mobileMenuButtonOpen: {
    backgroundColor:
      'rgba(37,99,235,0.15)',

    borderColor:
      'rgba(59,130,246,0.30)',
  },

  mobilePressed: {
    backgroundColor:
      'rgba(255,255,255,0.10)',

    transform: [
      {
        scale: 0.95,
      },
    ],
  },


  /* =======================================================
     MOBILE MENU
  ======================================================= */

  mobileMenu: {
    backgroundColor: COLORS.navy2,

    paddingHorizontal: 12,
    paddingBottom: 15,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },


  /* =======================================================
     MOBILE PROFILE
  ======================================================= */

  mobileProfile: {
    minHeight: 84,

    marginTop: 12,

    padding: 12,

    borderRadius: 18,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      'rgba(37,99,235,0.105)',

    borderWidth: 1,
    borderColor:
      'rgba(59,130,246,0.24)',
  },

  mobileProfilePressed: {
    backgroundColor:
      'rgba(37,99,235,0.19)',

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  mobileLargeAvatar: {
    width: 56,
    height: 56,

    borderRadius: 28,

    backgroundColor: COLORS.blue,

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',

    marginRight: 12,

    borderWidth: 2,
    borderColor:
      'rgba(255,255,255,0.20)',
  },

  mobileProfileInfo: {
    flex: 1,

    minWidth: 0,
  },

  mobileProfileName: {
    color: COLORS.white,

    fontSize: 14,
    fontWeight: '900',
  },

  mobileRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 4,
  },

  mobileOnlineDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor: COLORS.cyanLight,

    marginRight: 5,
  },

  mobileProfileRole: {
    color: COLORS.cyanLight,

    fontSize: 9,
    fontWeight: '800',
  },

  mobileProfileHint: {
    color: COLORS.mutedDark,

    fontSize: 8,

    marginTop: 4,
  },

  mobileProfileArrow: {
    color: COLORS.muted,

    fontSize: 22,

    marginLeft: 5,
  },


  /* =======================================================
     MOBILE NAV
  ======================================================= */

  mobileNavigation: {
    marginTop: 10,
  },

  mobileNavItem: {
    minHeight: 50,

    paddingHorizontal: 8,

    borderRadius: 13,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 4,
  },

  mobileNavActive: {
    backgroundColor: COLORS.active,

    borderWidth: 1,
    borderColor: COLORS.activeBorder,
  },

  mobileNavPressed: {
    backgroundColor:
      'rgba(255,255,255,0.065)',
  },

  mobileNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  mobileIconBox: {
    width: 34,
    height: 34,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.045)',

    marginRight: 10,
  },

  mobileIconBoxActive: {
    backgroundColor:
      'rgba(37,99,235,0.22)',
  },

  mobileNavIcon: {
    color: COLORS.muted,

    fontSize: 15,
  },

  mobileNavIconActive: {
    color: COLORS.cyanLight,
  },

  mobileNavText: {
    color: COLORS.muted,

    fontSize: 13,
    fontWeight: '800',
  },

  mobileNavTextActive: {
    color: COLORS.white,
  },

  mobileArrow: {
    color: COLORS.mutedDark,

    fontSize: 18,

    marginRight: 5,
  },

  mobileArrowActive: {
    color: COLORS.cyanLight,
  },

  mobileExternal: {
    color: COLORS.mutedDark,

    fontSize: 15,

    marginRight: 5,
  },


  /* =======================================================
     MOBILE LOGOUT
  ======================================================= */

  mobileLogout: {
    height: 48,

    marginTop: 9,

    borderRadius: 13,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.dangerBg,

    borderWidth: 1,
    borderColor:
      COLORS.dangerBorder,
  },

  mobileLogoutPressed: {
    backgroundColor:
      'rgba(251,113,133,0.16)',
  },

  mobileLogoutIcon: {
    color: COLORS.danger,

    fontSize: 17,

    marginRight: 7,
  },

  mobileLogoutText: {
    color: COLORS.danger,

    fontSize: 11,
    fontWeight: '900',
  },


  /* =======================================================
     MOBILE FOOTER
  ======================================================= */

  mobileFooter: {
    alignItems: 'center',

    paddingTop: 13,

    marginTop: 13,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  mobileFooterDot: {
    width: 4,
    height: 4,

    borderRadius: 2,

    backgroundColor: COLORS.cyanLight,

    marginBottom: 5,
  },

  mobileFooterText: {
    color: COLORS.white,

    fontSize: 9,
    fontWeight: '900',

    letterSpacing: 2,
  },

  mobileFooterSub: {
    color: COLORS.mutedDark,

    fontSize: 7,
    fontWeight: '700',

    marginTop: 3,
  },


  /* =======================================================
     PUBLIC MOBILE
  ======================================================= */

  publicWelcome: {
    alignItems: 'center',

    paddingTop: 16,
    paddingBottom: 8,
  },

  publicLogoCircle: {
    width: 55,
    height: 55,

    borderRadius: 28,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',

    marginBottom: 9,
  },

  publicLogo: {
    width: 44,
    height: 44,
  },

  publicTitle: {
    color: COLORS.white,

    fontSize: 16,
    fontWeight: '900',
  },

  publicSubtitle: {
    color: COLORS.mutedDark,

    fontSize: 9,

    marginTop: 4,

    textAlign: 'center',
  },


  /* =======================================================
     MOBILE AUTH
  ======================================================= */

  mobileAuth: {
    marginTop: 9,
  },

  mobileSignIn: {
    height: 47,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: COLORS.border,

    marginBottom: 8,
  },

  mobileSignInText: {
    color: COLORS.white,

    fontSize: 12,
    fontWeight: '900',
  },

  mobileRegister: {
    height: 47,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.blue,

    shadowColor: COLORS.blue,
    shadowOpacity: 0.20,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },

  mobileRegisterText: {
    color: COLORS.white,

    fontSize: 12,
    fontWeight: '900',
  },

});