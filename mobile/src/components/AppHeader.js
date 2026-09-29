import React, {
  useRef,
  useState,
} from 'react';

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

  white: '#FFFFFF',

  blue: '#2563EB',

  cyanLight: '#5EEAD4',

  text: '#E2E8F0',
  muted: '#94A3B8',
  mutedDark: '#64748B',

  border: 'rgba(255,255,255,0.085)',

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
     RESPONSIVE BREAKPOINTS

     PHONE:
     < 760

     TABLET:
     760 - 1079

     LAPTOP/DESKTOP:
     >= 1080
  ======================================================= */

  const isMobile = width < 760;

  const isTablet =
    width >= 760 &&
    width < 1080;

  const isDesktop =
    width >= 1080;


  /* =======================================================
     MENU
  ======================================================= */

  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuAnimation =
    useRef(
      new Animated.Value(0)
    ).current;


  /* =======================================================
     PROFILE ANIMATION
  ======================================================= */

  const profileAnimation =
    useRef(
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
     OPEN MENU
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

          duration: 350,

          delay: 60,

          easing: Easing.out(
            Easing.cubic
          ),

          useNativeDriver: true,
        }
      ),

    ]).start();

  };


  /* =======================================================
     CLOSE MENU
  ======================================================= */

  const closeMenu = () => {

    Animated.parallel([

      Animated.timing(
        menuAnimation,
        {
          toValue: 0,

          duration: 200,

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


  /* =======================================================
     TOGGLE MENU
  ======================================================= */

  const toggleMenu = () => {

    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }

  };


  /* =======================================================
     DOCTOR INFORMATION
  ======================================================= */

  const doctorName =
    doctor?.name ||
    doctor?.fullName ||
    doctor?.doctorName ||
    'Doctor';


  const doctorPhoto =
    typeof doctor?.clinicLogo === 'string' &&
    doctor.clinicLogo.trim()
      ? doctor.clinicLogo.trim()
      : null;


  const doctorInitial =
    doctorName
      .trim()
      .charAt(0)
      .toUpperCase() || 'D';


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
     NAVIGATE
  ======================================================= */

  const goTo = (screen) => {

    closeMenu();

    navigation.navigate(screen);

  };


  /* =======================================================
     HOME
  ======================================================= */

  const goHome = () => {

    closeMenu();

    if (!token) {

      navigation.navigate('About');

      return;

    }

    navigation.navigate(
      role === 'admin'
        ? 'AdminDashboard'
        : 'Dashboard'
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
        'AlphaAryX opening error:',
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


  /* =========================================================
     DESKTOP / LAPTOP

     IMPORTANT:

     >= 1080 ONLY

     NO HAMBURGER HERE
========================================================= */

  if (isDesktop) {

    return (
      <SafeAreaView
        edges={['top']}
        style={styles.safeArea}
      >

        <View
          style={styles.desktopHeader}
        >

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <View
            style={styles.desktopLeft}
          >

            {/* BACK BUTTON */}

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

                <Text
                  style={styles.backText}
                >
                  Back
                </Text>

              </Pressable>

            )}


            {/* VEDA LOGO */}

            <Pressable
              onPress={goHome}
              style={({ pressed }) => [
                styles.desktopLogoBox,
                pressed &&
                  styles.logoPressed,
              ]}
            >

              <Image
                source={VEDA_LOGO}
                style={styles.desktopLogo}
                resizeMode="contain"
              />

            </Pressable>


            {/* VEDA BRAND */}

            <View
              style={styles.desktopBrand}
            >

              <Text
                style={styles.desktopBrandName}
              >
                VEDA
              </Text>

              <View
                style={styles.brandSubtitleRow}
              >

                <View
                  style={styles.brandDot}
                />

                <Text
                  style={
                    styles.desktopBrandSubtitle
                  }
                >
                  MEDICAL PRACTICE
                </Text>

              </View>

            </View>


            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}

            <View
              style={styles.desktopNavigation}
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
                          styles.desktopNavItemActive,

                        pressed &&
                          styles.desktopNavItemPressed,
                      ]}
                    >

                      <Text
                        style={[
                          styles.desktopNavIcon,

                          active &&
                            styles.desktopNavIconActive,
                        ]}
                      >
                        {item.icon}
                      </Text>

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
                            styles.desktopActiveLine
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
                  styles.desktopNavItem,

                  pressed &&
                    styles.desktopNavItemPressed,
                ]}
              >

                <Text
                  style={
                    styles.desktopNavIcon
                  }
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
                  style={
                    styles.externalIcon
                  }
                >
                  ↗
                </Text>

              </Pressable>

            </View>

          </View>


          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <View
            style={styles.desktopRight}
          >

            {token ? (

              <>

                {/* SECURE BADGE */}

                <View
                  style={
                    styles.secureBadge
                  }
                >

                  <View
                    style={
                      styles.secureDot
                    }
                  />

                  <Text
                    style={
                      styles.secureText
                    }
                  >
                    SECURE
                  </Text>

                </View>


                {/* =================================================
                    PROFILE BUTTON

                    THIS IS ALWAYS VISIBLE ON DESKTOP
                ================================================= */}

                <Pressable
                  onPress={openProfile}
                  style={({ pressed }) => [
                    styles.desktopProfileButton,

                    pressed &&
                      styles.desktopProfilePressed,
                  ]}
                >

                  {/* AVATAR */}

                  <View
                    style={
                      styles.desktopProfileAvatar
                    }
                  >

                    {renderAvatar(false)}

                  </View>


                  {/* NAME + ROLE */}

                  <View
                    style={
                      styles.desktopProfileInfo
                    }
                  >

                    <Text
                      numberOfLines={1}
                      style={
                        styles.desktopProfileName
                      }
                    >
                      {doctorName}
                    </Text>


                    <View
                      style={
                        styles.desktopRoleRow
                      }
                    >

                      <View
                        style={
                          styles.desktopOnlineDot
                        }
                      />

                      <Text
                        style={
                          styles.desktopProfileRole
                        }
                      >
                        {role === 'admin'
                          ? 'Administrator'
                          : 'Doctor'}
                      </Text>

                    </View>

                  </View>


                  {/* ARROW */}

                  <Text
                    style={
                      styles.desktopProfileArrow
                    }
                  >
                    →
                  </Text>

                </Pressable>


                {/* DESKTOP LOGOUT */}

                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => [
                    styles.desktopLogout,

                    pressed &&
                      styles.desktopLogoutPressed,
                  ]}
                >

                  <Text
                    style={
                      styles.desktopLogoutIcon
                    }
                  >
                    ⎋
                  </Text>

                  <Text
                    style={
                      styles.desktopLogoutText
                    }
                  >
                    Sign Out
                  </Text>

                </Pressable>

              </>

            ) : (

              /* =================================================
                 PUBLIC DESKTOP
              ================================================= */

              <>

                <Pressable
                  onPress={() =>
                    goTo('Login')
                  }
                  style={({ pressed }) => [
                    styles.desktopSignIn,

                    pressed &&
                      styles.desktopSignInPressed,
                  ]}
                >

                  <Text
                    style={
                      styles.desktopSignInText
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
                    styles.desktopRegister,

                    pressed &&
                      styles.desktopRegisterPressed,
                  ]}
                >

                  <Text
                    style={
                      styles.desktopRegisterText
                    }
                  >
                    Register
                  </Text>

                </Pressable>

              </>

            )}

          </View>

        </View>

      </SafeAreaView>
    );

  }


  /* =========================================================
     PHONE + TABLET

     < 1080

     HAMBURGER IS SHOWN
========================================================= */

  return (
    <SafeAreaView
      edges={['top']}
      style={styles.safeArea}
    >

      <View
        style={[
          styles.mobileHeader,

          isTablet &&
            styles.tabletHeader,
        ]}
      >

        {/* =================================================
            TOP BAR
        ================================================= */}

        <View
          style={[
            styles.mobileTopBar,

            isTablet &&
              styles.tabletTopBar,
          ]}
        >

          {/* LEFT */}

          <View
            style={styles.mobileLeft}
          >

            {/* BACK */}

            {canGoBack && (

              <Pressable
                onPress={goBack}
                style={({ pressed }) => [
                  styles.mobileBackButton,

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


            {/* LOGO */}

            <Pressable
              onPress={goHome}
              style={({ pressed }) => [
                styles.mobileLogoBox,

                pressed &&
                  styles.logoPressed,
              ]}
            >

              <Image
                source={VEDA_LOGO}
                style={
                  styles.mobileLogo
                }
                resizeMode="contain"
              />

            </Pressable>


            {/* BRAND */}

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
                  styles.mobileBrandSubtitle
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

            {token && (

              <View
                style={
                  styles.mobileSecureDotBox
                }
              >

                <View
                  style={
                    styles.mobileSecureDot
                  }
                />

              </View>

            )}


            {/* =================================================
                HAMBURGER
            ================================================= */}

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

                {/* TOP */}

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

                {/* MIDDLE */}

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

                {/* BOTTOM */}

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
            AUTHENTICATED MENU
        ================================================= */}

        {token && menuOpen && (

          <Animated.View
            style={[
              styles.mobileMenu,

              isTablet &&
                styles.tabletMenu,

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
                          -12,
                          0,
                        ],
                      }),
                  },
                ],
              },
            ]}
          >

            {/* =================================================
                PROFILE CARD
            ================================================= */}

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
                          10,
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


            {/* =================================================
                NAVIGATION
            ================================================= */}

            <View
              style={
                styles.mobileNavigation
              }
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
                                  12 +
                                    index * 3,
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
                    style={
                      styles.mobileIconBox
                    }
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


            {/* =================================================
                LOGOUT
            ================================================= */}

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


            {/* =================================================
                FOOTER
            ================================================= */}

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
            PUBLIC MENU
        ================================================= */}

        {!token && menuOpen && (

          <Animated.View
            style={[
              styles.mobileMenu,

              isTablet &&
                styles.tabletMenu,

              {
                opacity:
                  menuAnimation,
              },
            ]}
          >

            {/* WELCOME */}

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


            {/* PUBLIC NAV */}

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


            {/* AUTH BUTTONS */}

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
                    styles.mobileRegisterPressed,
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

  /* =======================================================
     COMMON
  ======================================================= */

  safeArea: {
    backgroundColor:
      COLORS.black,
  },


  /* =======================================================
     DESKTOP HEADER
  ======================================================= */

  desktopHeader: {
    minHeight: 76,

    paddingHorizontal: 20,

    backgroundColor:
      COLORS.navy,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    borderBottomWidth: 1,

    borderBottomColor:
      COLORS.border,

    shadowColor: '#000',

    shadowOpacity: 0.28,

    shadowRadius: 16,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 9,

    zIndex: 100,
  },


  desktopLeft: {
    flex: 1,

    minWidth: 0,

    flexDirection: 'row',

    alignItems: 'center',
  },


  desktopRight: {
    flexShrink: 0,

    flexDirection: 'row',

    alignItems: 'center',

    marginLeft: 12,
  },


  /* =======================================================
     DESKTOP BACK
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
      'rgba(255,255,255,0.10)',
  },


  backIcon: {
    color:
      COLORS.white,

    fontSize: 31,

    lineHeight: 31,

    fontWeight: '300',

    marginTop: -3,
  },


  backText: {
    color:
      COLORS.muted,

    fontSize: 11,

    fontWeight: '800',

    marginLeft: 2,
  },


  /* =======================================================
     DESKTOP LOGO
  ======================================================= */

  desktopLogoBox: {
    width: 49,

    height: 49,

    borderRadius: 15,

    backgroundColor:
      COLORS.white,

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.7)',

    marginRight: 9,
  },


  desktopLogo: {
    width: 40,

    height: 40,
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
     DESKTOP BRAND
  ======================================================= */

  desktopBrand: {
    minWidth: 105,

    marginRight: 15,
  },


  desktopBrandName: {
    color:
      COLORS.white,

    fontSize: 15,

    fontWeight: '900',

    letterSpacing: 2,
  },


  brandSubtitleRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 3,
  },


  brandDot: {
    width: 4,

    height: 4,

    borderRadius: 2,

    backgroundColor:
      COLORS.cyanLight,

    marginRight: 5,
  },


  desktopBrandSubtitle: {
    color:
      COLORS.mutedDark,

    fontSize: 7,

    fontWeight: '800',

    letterSpacing: 0.6,
  },


  /* =======================================================
     DESKTOP NAVIGATION
  ======================================================= */

  desktopNavigation: {
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


  desktopNavItemActive: {
    backgroundColor:
      COLORS.active,

    borderWidth: 1,

    borderColor:
      COLORS.activeBorder,
  },


  desktopNavItemPressed: {
    opacity: 0.70,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },


  desktopNavIcon: {
    color:
      COLORS.mutedDark,

    fontSize: 13,

    marginRight: 5,
  },


  desktopNavIconActive: {
    color:
      COLORS.cyanLight,
  },


  desktopNavText: {
    color:
      COLORS.muted,

    fontSize: 11,

    fontWeight: '800',
  },


  desktopNavTextActive: {
    color:
      COLORS.white,
  },


  desktopActiveLine: {
    position: 'absolute',

    bottom: 3,

    width: 17,

    height: 2,

    borderRadius: 2,

    backgroundColor:
      COLORS.cyanLight,
  },


  externalIcon: {
    color:
      COLORS.mutedDark,

    fontSize: 10,

    marginLeft: 4,
  },


  /* =======================================================
     SECURE
  ======================================================= */

  secureBadge: {
    height: 35,

    paddingHorizontal: 9,

    marginRight: 8,

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

    backgroundColor:
      COLORS.cyanLight,

    marginRight: 5,
  },


  secureText: {
    color:
      COLORS.cyanLight,

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 1,
  },


  /* =======================================================
     DESKTOP PROFILE
  ======================================================= */

  desktopProfileButton: {
    width: 170,

    height: 48,

    paddingHorizontal: 8,

    borderRadius: 15,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.055)',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.12)',
  },


  desktopProfilePressed: {
    backgroundColor:
      'rgba(37,99,235,0.16)',

    transform: [
      {
        scale: 0.98,
      },
    ],
  },


  desktopProfileAvatar: {
    width: 35,

    height: 35,

    borderRadius: 12,

    backgroundColor:
      COLORS.blue,

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',

    marginRight: 9,

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.20)',
  },


  desktopProfileInfo: {
    flex: 1,

    minWidth: 0,
  },


  desktopProfileName: {
    color:
      COLORS.white,

    fontSize: 11,

    fontWeight: '900',
  },


  desktopRoleRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 3,
  },


  desktopOnlineDot: {
    width: 4,

    height: 4,

    borderRadius: 2,

    backgroundColor:
      COLORS.cyanLight,

    marginRight: 4,
  },


  desktopProfileRole: {
    color:
      COLORS.cyanLight,

    fontSize: 8,

    fontWeight: '800',
  },


  desktopProfileArrow: {
    color:
      COLORS.muted,

    fontSize: 17,

    marginLeft: 6,
  },


  avatarImage: {
    width: '100%',

    height: '100%',
  },


  avatarText: {
    color:
      COLORS.white,

    fontSize: 14,

    fontWeight: '900',
  },


  avatarLargeImage: {
    width: '100%',

    height: '100%',
  },


  avatarLargeText: {
    color:
      COLORS.white,

    fontSize: 21,

    fontWeight: '900',
  },


  /* =======================================================
     DESKTOP LOGOUT
  ======================================================= */

  desktopLogout: {
    height: 42,

    paddingHorizontal: 11,

    marginLeft: 7,

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


  desktopLogoutPressed: {
    backgroundColor:
      'rgba(251,113,133,0.16)',

    transform: [
      {
        scale: 0.97,
      },
    ],
  },


  desktopLogoutIcon: {
    color:
      COLORS.danger,

    fontSize: 15,

    marginRight: 5,
  },


  desktopLogoutText: {
    color:
      COLORS.danger,

    fontSize: 9,

    fontWeight: '900',
  },


  /* =======================================================
     DESKTOP LOGIN / REGISTER
  ======================================================= */

  desktopSignIn: {
    height: 42,

    paddingHorizontal: 14,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',
  },


  desktopSignInPressed: {
    backgroundColor:
      'rgba(255,255,255,0.07)',
  },


  desktopSignInText: {
    color:
      COLORS.white,

    fontSize: 11,

    fontWeight: '900',
  },


  desktopRegister: {
    height: 42,

    paddingHorizontal: 16,

    marginLeft: 5,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor:
      COLORS.blue,
  },


  desktopRegisterPressed: {
    opacity: 0.80,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },


  desktopRegisterText: {
    color:
      COLORS.white,

    fontSize: 11,

    fontWeight: '900',
  },


  /* =======================================================
     MOBILE HEADER
  ======================================================= */

  mobileHeader: {
    backgroundColor:
      COLORS.navy,

    borderBottomWidth: 1,

    borderBottomColor:
      COLORS.border,

    shadowColor: '#000',

    shadowOpacity: 0.28,

    shadowRadius: 16,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 9,

    zIndex: 100,
  },


  tabletHeader: {
    minHeight: 76,
  },


  mobileTopBar: {
    minHeight: 68,

    paddingHorizontal: 12,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',
  },


  tabletTopBar: {
    minHeight: 76,

    paddingHorizontal: 18,
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

  mobileBackButton: {
    width: 38,

    height: 43,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 2,
  },


  mobileBackIcon: {
    color:
      COLORS.white,

    fontSize: 34,

    lineHeight: 34,

    fontWeight: '300',

    marginTop: -4,
  },


  /* =======================================================
     MOBILE LOGO
  ======================================================= */

  mobileLogoBox: {
    width: 44,

    height: 44,

    borderRadius: 13,

    backgroundColor:
      COLORS.white,

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.7)',
  },


  mobileLogo: {
    width: 36,

    height: 36,
  },


  mobileBrand: {
    marginLeft: 8,

    minWidth: 0,
  },


  mobileBrandName: {
    color:
      COLORS.white,

    fontSize: 13,

    fontWeight: '900',

    letterSpacing: 1.8,
  },


  mobileBrandSubtitle: {
    color:
      COLORS.mutedDark,

    fontSize: 7,

    fontWeight: '800',

    marginTop: 2,

    letterSpacing: 0.5,
  },


  /* =======================================================
     MOBILE SECURE
  ======================================================= */

  mobileSecureDotBox: {
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

    backgroundColor:
      COLORS.cyanLight,
  },


  /* =======================================================
     MOBILE HAMBURGER
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


  menuLines: {
    width: 21,

    height: 16,

    alignItems: 'center',

    justifyContent:
      'space-between',
  },


  menuLine: {
    width: 21,

    height: 2,

    borderRadius: 2,

    backgroundColor:
      COLORS.white,
  },


  /* =======================================================
     MOBILE MENU
  ======================================================= */

  mobileMenu: {
    backgroundColor:
      COLORS.navy2,

    paddingHorizontal: 12,

    paddingBottom: 15,

    borderTopWidth: 1,

    borderTopColor:
      COLORS.border,
  },


  tabletMenu: {
    paddingHorizontal: 18,

    paddingBottom: 20,
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

    backgroundColor:
      COLORS.blue,

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
    color:
      COLORS.white,

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

    backgroundColor:
      COLORS.cyanLight,

    marginRight: 5,
  },


  mobileProfileRole: {
    color:
      COLORS.cyanLight,

    fontSize: 9,

    fontWeight: '800',
  },


  mobileProfileHint: {
    color:
      COLORS.mutedDark,

    fontSize: 8,

    marginTop: 4,
  },


  mobileProfileArrow: {
    color:
      COLORS.muted,

    fontSize: 22,

    marginLeft: 5,
  },


  /* =======================================================
     MOBILE NAVIGATION
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

    justifyContent:
      'space-between',

    marginBottom: 4,
  },


  mobileNavActive: {
    backgroundColor:
      COLORS.active,

    borderWidth: 1,

    borderColor:
      COLORS.activeBorder,
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
    color:
      COLORS.muted,

    fontSize: 15,
  },


  mobileNavIconActive: {
    color:
      COLORS.cyanLight,
  },


  mobileNavText: {
    color:
      COLORS.muted,

    fontSize: 13,

    fontWeight: '800',
  },


  mobileNavTextActive: {
    color:
      COLORS.white,
  },


  mobileArrow: {
    color:
      COLORS.mutedDark,

    fontSize: 18,

    marginRight: 5,
  },


  mobileArrowActive: {
    color:
      COLORS.cyanLight,
  },


  mobileExternal: {
    color:
      COLORS.mutedDark,

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
    color:
      COLORS.danger,

    fontSize: 17,

    marginRight: 7,
  },


  mobileLogoutText: {
    color:
      COLORS.danger,

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

    borderTopColor:
      COLORS.border,
  },


  mobileFooterDot: {
    width: 4,

    height: 4,

    borderRadius: 2,

    backgroundColor:
      COLORS.cyanLight,

    marginBottom: 5,
  },


  mobileFooterText: {
    color:
      COLORS.white,

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 2,
  },


  mobileFooterSub: {
    color:
      COLORS.mutedDark,

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

    backgroundColor:
      COLORS.white,

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
    color:
      COLORS.white,

    fontSize: 16,

    fontWeight: '900',
  },


  publicSubtitle: {
    color:
      COLORS.mutedDark,

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

    borderColor:
      COLORS.border,

    marginBottom: 8,
  },


  mobileSignInText: {
    color:
      COLORS.white,

    fontSize: 12,

    fontWeight: '900',
  },


  mobileRegister: {
    height: 47,

    borderRadius: 13,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor:
      COLORS.blue,
  },


  mobileRegisterPressed: {
    opacity: 0.80,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },


  mobileRegisterText: {
    color:
      COLORS.white,

    fontSize: 12,

    fontWeight: '900',
  },

});