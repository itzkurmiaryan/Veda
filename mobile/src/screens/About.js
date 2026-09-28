import React from 'react';

import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  Card,
  FadeIn,
  Screen,
  colors,
} from '../components/UI';

export default function About() {
  const { width } = useWindowDimensions();

  const isMobile = width < 600;

  const openAlphaAryX = () => {
    Linking.openURL('https://alphaaryx.vercel.app/');
  };

  return (
    <Screen scroll>
      <FadeIn>

        {/* =========================
            HERO
        ========================== */}

        <View style={styles.hero}>

          <View style={styles.heroBadge}>
            <View style={styles.statusDot} />

            <Text style={styles.badgeText}>
              SMART HEALTHCARE PLATFORM
            </Text>
          </View>

          <Text style={styles.title}>
            Healthcare,
            {'\n'}
            <Text style={styles.titleAccent}>
              simplified.
            </Text>
          </Text>

          <Text style={styles.subtitle}>
            Veda is a modern digital healthcare platform
            designed to help doctors manage patients,
            prescriptions and clinical records with
            simplicity and efficiency.
          </Text>

          <View style={styles.heroStats}>

            <Stat
              number="01"
              label="Patient Records"
            />

            <View style={styles.statDivider} />

            <Stat
              number="02"
              label="Digital Prescriptions"
            />

            <View style={styles.statDivider} />

            <Stat
              number="03"
              label="Professional PDFs"
            />

          </View>

        </View>


        {/* =========================
            WHAT IS VEDA
        ========================== */}

        <Card accent>

          <View style={styles.sectionTop}>

            <View style={styles.sectionIcon}>
              <Text style={styles.sectionIconText}>
                V
              </Text>
            </View>

            <View style={styles.sectionHeadingWrap}>
              <Text style={styles.eyebrow}>
                THE PLATFORM
              </Text>

              <Text style={styles.sectionTitle}>
                What is Veda?
              </Text>
            </View>

          </View>

          <Text style={styles.text}>
            Veda is a Smart Digital Prescription &
            Patient Record Management System created
            to bring essential clinical workflows into
            one organized digital platform.
          </Text>

          <Text style={styles.text}>
            From creating patient records to managing
            visits and generating professional
            prescription documents, Veda keeps
            everything structured and accessible.
          </Text>

        </Card>


        {/* =========================
            FEATURES
        ========================== */}

        <View style={styles.sectionHeader}>

          <Text style={styles.eyebrow}>
            BUILT FOR DOCTORS
          </Text>

          <Text style={styles.heading}>
            Everything you need,
            {'\n'}
            in one place.
          </Text>

          <Text style={styles.headingSub}>
            Simple tools designed around everyday
            healthcare workflows.
          </Text>

        </View>


        <View style={styles.grid}>

          <Feature
            number="01"
            icon="♙"
            title="Patient Management"
            text="Create, search and manage digital patient records from one organized workspace."
          />

          <Feature
            number="02"
            icon="Rx"
            title="Digital Prescriptions"
            text="Create and maintain structured prescriptions without relying on paper records."
          />

          <Feature
            number="03"
            icon="▣"
            title="Professional PDFs"
            text="Generate clean, professional doctor-style prescription documents."
          />

          <Feature
            number="04"
            icon="↗"
            title="Easy Sharing"
            text="Share prescription documents with patients quickly and conveniently."
          />

          <Feature
            number="05"
            icon="◉"
            title="Doctor Profile"
            text="Maintain professional doctor and clinic information in your account."
          />

          <Feature
            number="06"
            icon="▤"
            title="Analytics"
            text="Access useful insights from your patient and prescription activity."
          />

        </View>


        {/* =========================
            WHY VEDA
        ========================== */}

        <Card>

          <Text style={styles.eyebrow}>
            WHY VEDA
          </Text>

          <Text style={styles.sectionTitle}>
            Designed for a
            {'\n'}
            smoother workflow.
          </Text>

          <View style={styles.benefitList}>

            <Benefit
              icon="✓"
              title="Less paperwork"
              text="Keep important patient information digitally organized."
            />

            <Benefit
              icon="⚡"
              title="Faster workflow"
              text="Access patients and prescriptions without unnecessary steps."
            />

            <Benefit
              icon="◆"
              title="Professional output"
              text="Create clean prescription documents ready to share."
            />

            <Benefit
              icon="⌁"
              title="One workspace"
              text="Manage essential patient and prescription information together."
            />

          </View>

        </Card>


        {/* =========================
            ALPHAARYX
        ========================== */}

        <View style={styles.companySection}>

          <Text style={styles.eyebrow}>
            DEVELOPED BY
          </Text>

          <Text style={styles.companyTitle}>
            AlphaAryX
          </Text>

          <Text style={styles.companyText}>
            Veda is developed as a digital healthcare
            solution under AlphaAryX — building
            practical digital products for real-world
            needs.
          </Text>

          <Pressable
            onPress={openAlphaAryX}
            style={({ pressed }) => [
              styles.companyButton,
              pressed && styles.pressed,
            ]}
          >

            <View style={styles.companyButtonLeft}>

              <View style={styles.companyLogo}>
                <Text style={styles.companyLogoText}>
                  A
                </Text>
              </View>

              <View>
                <Text style={styles.companyButtonTitle}>
                  Visit AlphaAryX
                </Text>

                <Text style={styles.companyButtonSub}>
                  Product & Digital Solutions
                </Text>
              </View>

            </View>

            <Text style={styles.arrow}>
              ↗
            </Text>

          </Pressable>

        </View>


        {/* =========================
            FINAL MESSAGE
        ========================== */}

        <View style={styles.finalBox}>

          <View style={styles.finalLine} />

          <Text style={styles.finalTitle}>
            Better records.
            {'\n'}
            Better workflow.
          </Text>

          <Text style={styles.finalText}>
            Veda aims to make everyday digital
            healthcare management simpler.
          </Text>

        </View>

        {/* 
          IMPORTANT:
          No Footer here.
          Screen already renders the global Footer.
        */}

      </FadeIn>
    </Screen>
  );
}


/* =========================
   STAT
========================= */

function Stat({ number, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNumber}>
        {number}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}


/* =========================
   FEATURE
========================= */

function Feature({
  number,
  icon,
  title,
  text,
}) {
  return (
    <View style={styles.feature}>

      <View style={styles.featureTop}>

        <View style={styles.featureIcon}>
          <Text style={styles.featureIconText}>
            {icon}
          </Text>
        </View>

        <Text style={styles.featureNumber}>
          {number}
        </Text>

      </View>

      <Text style={styles.featureTitle}>
        {title}
      </Text>

      <Text style={styles.featureText}>
        {text}
      </Text>

    </View>
  );
}


/* =========================
   BENEFIT
========================= */

function Benefit({
  icon,
  title,
  text,
}) {
  return (
    <View style={styles.benefit}>

      <View style={styles.benefitIcon}>
        <Text style={styles.benefitIconText}>
          {icon}
        </Text>
      </View>

      <View style={styles.benefitContent}>

        <Text style={styles.benefitTitle}>
          {title}
        </Text>

        <Text style={styles.benefitText}>
          {text}
        </Text>

      </View>

    </View>
  );
}


/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({

  hero: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 4,
  },

  heroBadge: {
    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#E8F3FF',

    borderWidth: 1,
    borderColor: '#D5E8FF',

    borderRadius: 30,

    paddingHorizontal: 12,
    paddingVertical: 8,

    marginBottom: 18,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,

    backgroundColor: '#22C55E',

    marginRight: 7,
  },

  badgeText: {
    color: colors.blue,

    fontSize: 10,
    fontWeight: '900',

    letterSpacing: 1,
  },

  title: {
    color: colors.ink,

    fontSize: 40,
    lineHeight: 45,

    fontWeight: '900',

    letterSpacing: -1.4,
  },

  titleAccent: {
    color: colors.blue,
  },

  subtitle: {
    color: colors.muted,

    fontSize: 15,
    lineHeight: 24,

    marginTop: 13,

    maxWidth: 700,
  },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 25,

    paddingTop: 20,

    borderTopWidth: 1,
    borderTopColor: colors.line,
  },

  stat: {
    flex: 1,
  },

  statNumber: {
    color: colors.blue,

    fontSize: 18,
    fontWeight: '900',

    marginBottom: 3,
  },

  statLabel: {
    color: colors.muted,

    fontSize: 10,
    fontWeight: '800',

    lineHeight: 15,
  },

  statDivider: {
    width: 1,
    height: 30,

    backgroundColor: colors.line,

    marginHorizontal: 12,
  },


  /* SECTION */

  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 15,
  },

  sectionIcon: {
    width: 48,
    height: 48,

    borderRadius: 15,

    backgroundColor: '#EAF4FF',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  sectionIconText: {
    color: colors.blue,

    fontSize: 20,
    fontWeight: '900',
  },

  sectionHeadingWrap: {
    flex: 1,
  },

  eyebrow: {
    color: colors.blue,

    fontSize: 10,
    fontWeight: '900',

    letterSpacing: 1.1,

    marginBottom: 5,
  },

  sectionTitle: {
    color: colors.ink,

    fontSize: 22,
    lineHeight: 27,

    fontWeight: '900',
  },

  text: {
    color: colors.muted,

    fontSize: 14,
    lineHeight: 22,

    marginBottom: 9,
  },


  /* FEATURES */

  sectionHeader: {
    paddingHorizontal: 4,

    marginTop: 25,
    marginBottom: 17,
  },

  heading: {
    color: colors.ink,

    fontSize: 27,
    lineHeight: 32,

    fontWeight: '900',

    letterSpacing: -0.5,
  },

  headingSub: {
    color: colors.muted,

    fontSize: 13,
    lineHeight: 20,

    marginTop: 7,

    maxWidth: 600,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    justifyContent: 'space-between',
  },

  feature: {
    width: '48.5%',

    backgroundColor: colors.white,

    borderWidth: 1,
    borderColor: colors.line,

    borderRadius: 18,

    padding: 17,

    marginBottom: 13,

    minHeight: 174,
  },

  featureTop: {
    flexDirection: 'row',
    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 14,
  },

  featureIcon: {
    width: 43,
    height: 43,

    borderRadius: 13,

    backgroundColor: '#EAF4FF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  featureIconText: {
    color: colors.blue,

    fontSize: 17,
    fontWeight: '900',
  },

  featureNumber: {
    color: '#CBD5E1',

    fontSize: 11,
    fontWeight: '900',
  },

  featureTitle: {
    color: colors.ink,

    fontSize: 15,
    fontWeight: '900',

    marginBottom: 7,
  },

  featureText: {
    color: colors.muted,

    fontSize: 12,
    lineHeight: 18,
  },


  /* BENEFITS */

  benefitList: {
    marginTop: 4,
  },

  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  benefitIcon: {
    width: 36,
    height: 36,

    borderRadius: 11,

    backgroundColor: '#ECFDF5',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  benefitIconText: {
    color: '#16A34A',

    fontSize: 15,
    fontWeight: '900',
  },

  benefitContent: {
    flex: 1,
  },

  benefitTitle: {
    color: colors.ink,

    fontSize: 14,
    fontWeight: '900',

    marginBottom: 3,
  },

  benefitText: {
    color: colors.muted,

    fontSize: 12,
    lineHeight: 18,
  },


  /* COMPANY */

  companySection: {
    marginTop: 24,

    backgroundColor: '#0F172A',

    borderRadius: 22,

    padding: 22,
  },

  companyTitle: {
    color: '#FFFFFF',

    fontSize: 28,
    fontWeight: '900',

    letterSpacing: -0.5,

    marginBottom: 8,
  },

  companyText: {
    color: '#94A3B8',

    fontSize: 13,
    lineHeight: 20,

    maxWidth: 650,

    marginBottom: 16,
  },

  companyButton: {
    minHeight: 64,

    backgroundColor: '#172554',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',

    borderRadius: 15,

    paddingHorizontal: 14,

    flexDirection: 'row',
    alignItems: 'center',

    justifyContent: 'space-between',
  },

  companyButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',

    flex: 1,
  },

  companyLogo: {
    width: 40,
    height: 40,

    borderRadius: 12,

    backgroundColor: colors.blue,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  companyLogoText: {
    color: '#FFFFFF',

    fontSize: 17,
    fontWeight: '900',
  },

  companyButtonTitle: {
    color: '#FFFFFF',

    fontSize: 13,
    fontWeight: '900',
  },

  companyButtonSub: {
    color: '#94A3B8',

    fontSize: 10,

    marginTop: 2,
  },

  arrow: {
    color: '#5EEAD4',

    fontSize: 23,
    fontWeight: '800',

    marginLeft: 10,
  },


  /* FINAL */

  finalBox: {
    alignItems: 'center',

    paddingTop: 35,
    paddingBottom: 20,

    paddingHorizontal: 10,
  },

  finalLine: {
    width: 45,
    height: 3,

    borderRadius: 5,

    backgroundColor: colors.blue,

    marginBottom: 17,
  },

  finalTitle: {
    color: colors.ink,

    fontSize: 23,
    lineHeight: 28,

    fontWeight: '900',

    textAlign: 'center',
  },

  finalText: {
    color: colors.muted,

    fontSize: 12,
    lineHeight: 19,

    textAlign: 'center',

    marginTop: 7,

    maxWidth: 450,
  },

  pressed: {
    opacity: 0.72,
  },
});