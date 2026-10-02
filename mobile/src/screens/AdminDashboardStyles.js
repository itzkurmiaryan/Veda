import { StyleSheet } from 'react-native';
import { colors } from '../components/UI';

const styles =
  StyleSheet.create({

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      paddingTop: 8,
      paddingBottom: 20,
    },

    headerText: {
      flex: 1,
      paddingRight: 15,
    },

    proofOverlay: {
      flex: 1,
      backgroundColor: 'rgba(7, 22, 32, 0.72)',
      justifyContent: 'center',
      padding: 18,
    },
    proofModal: {
      width: '100%',
      maxWidth: 560,
      maxHeight: '90%',
      alignSelf: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E2EAF0',
    },
    proofHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    proofHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    proofEyebrow: {
      color: '#14805E',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
    },
    proofTitle: {
      color: colors.ink,
      fontSize: 17,
      fontWeight: '800',
      marginTop: 3,
    },
    proofClose: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: '#F1F5F7',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,
    },
    proofCloseText: {
      color: '#526676',
      fontSize: 24,
      lineHeight: 27,
    },
    proofImage: {
      width: '100%',
      height: 340,
      backgroundColor: '#F3F6F8',
      borderRadius: 12,
    },
    proofFileName: {
      color: colors.muted,
      fontSize: 10,
      marginTop: 9,
    },
    paymentFormLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      marginTop: 12,
    },
    paymentModeRow: {
      flexDirection: 'row',
      marginTop: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#DDE7E8',
    },
    paymentFormScroll: {
      flexShrink: 1,
    },
    paymentModeButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    paymentModeSelected: {
      borderBottomColor: '#087A66',
    },
    paymentModeText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '700',
    },
    paymentModeTextSelected: {
      color: '#087A66',
      fontWeight: '900',
    },
    paymentUnpaidMessage: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 15,
    },
    paymentInput: {
      minHeight: 44,
      borderWidth: 1,
      borderColor: '#D9E3E7',
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      color: colors.ink,
      fontSize: 14,
      paddingHorizontal: 12,
      marginTop: 6,
    },
    paymentNoteInput: {
      minHeight: 84,
      paddingTop: 11,
      textAlignVertical: 'top',
    },
    paymentProofPicker: {
      alignSelf: 'flex-start',
      paddingVertical: 10,
      marginTop: 5,
    },
    paymentProofPickerText: {
      color: '#087A66',
      fontSize: 11,
      fontWeight: '800',
    },
    paymentProofPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: '#E7EEF0',
    },
    paymentProofThumbnail: {
      width: 40,
      height: 40,
      borderRadius: 5,
      backgroundColor: '#F1F5F6',
    },
    paymentProofName: {
      flex: 1,
      color: colors.muted,
      fontSize: 10,
      marginHorizontal: 9,
    },
    paymentProofRemove: {
      color: colors.danger,
      fontSize: 10,
      fontWeight: '700',
    },
    paymentEntryActions: {
      flexDirection: 'row',
      marginHorizontal: -4,
      marginTop: 16,
    },
    paymentEntryAction: {
      flex: 1,
      marginHorizontal: 4,
    },
    paymentHistoryList: {
      maxHeight: 420,
    },
    paymentHistoryRow: {
      borderTopWidth: 1,
      borderTopColor: '#E7EEF0',
      paddingVertical: 12,
    },
    paymentHistoryAmount: {
      color: colors.ink,
      fontSize: 15,
      fontWeight: '800',
    },
    paymentHistoryDate: {
      color: colors.muted,
      fontSize: 11,
      marginTop: 4,
    },
    paymentHistoryNote: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 6,
    },
    paymentHistoryLink: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingVertical: 5,
    },
    paymentHistoryLinkText: {
      color: '#087A66',
      fontSize: 11,
      fontWeight: '800',
    },

    adminLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: '#EAF7FA',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginBottom: 9,
    },

    adminDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        colors.cyan,
      marginRight: 7,
    },

    adminLabelText: {
      color: colors.cyan,
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 1.2,
    },

    title: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '900',
      color: colors.ink,
    },

    subtitle: {
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.muted,
      marginTop: 5,
      maxWidth: 400,
    },

    avatar: {
      width: 52,
      height: 52,
      borderRadius: 17,
      backgroundColor:
        '#102A38',
      alignItems: 'center',
      justifyContent:
        'center',
      elevation: 4,
    },

    avatarText: {
      color: '#FFFFFF',
      fontSize: 19,
      fontWeight: '900',
    },

    sectionTop: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent:
        'space-between',
      marginBottom: 11,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent:
        'space-between',
      marginTop: 25,
      marginBottom: 11,
    },

    doctorSectionHeader: {
      marginTop: 27,
    },

    sectionEyebrow: {
      color: colors.cyan,
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 1.5,
      marginBottom: 3,
    },

    sectionTitle: {
      color: colors.ink,
      fontSize: 19,
      fontWeight: '900',
    },

    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },

    kpiCard: {
      width: '50%',
      paddingHorizontal: 4,
      marginBottom: 8,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        '#E6EDF1',
      padding: 14,
      minHeight: 128,
      elevation: 1,
    },

    kpiCardClickable: {
      borderColor: '#C8DCD8',
    },

    doctorTargetList: {
      marginTop: 7,
      paddingHorizontal: 12,
      borderTopWidth: 1,
      borderTopColor: '#DDE7E8',
    },

    doctorTargetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
    },

    doctorTargetTitle: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: '800',
    },

    doctorTargetClose: {
      color: colors.muted,
      fontSize: 22,
      paddingHorizontal: 8,
    },

    doctorTargetRow: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#E9EFF0',
      paddingVertical: 8,
    },

    doctorTargetIdentity: {
      flex: 1,
      minWidth: 0,
    },

    doctorTargetName: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: '700',
    },

    doctorTargetEmail: {
      color: colors.muted,
      fontSize: 10,
      marginTop: 3,
    },

    doctorTargetArrow: {
      color: '#087A66',
      fontSize: 23,
      marginLeft: 10,
    },

    doctorTargetEmpty: {
      color: colors.muted,
      fontSize: 11,
      paddingVertical: 10,
    },

    directoryRow: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: '#E8EEF0',
    },

    directoryAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E7F3F1',
      marginRight: 10,
    },

    directoryAvatarText: {
      color: '#087A66',
      fontSize: 14,
      fontWeight: '800',
    },

    directoryIdentity: {
      flex: 1,
      minWidth: 0,
    },

    directoryName: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: '800',
    },

    directoryEmail: {
      color: colors.muted,
      fontSize: 10,
      marginTop: 3,
    },

    directoryStatuses: {
      alignItems: 'flex-end',
      marginLeft: 8,
    },

    directoryStatus: {
      fontSize: 8,
      fontWeight: '800',
    },

    directoryStatusActive: {
      color: '#16815E',
    },

    directoryStatusInactive: {
      color: '#B54C3D',
    },

    directoryPayment: {
      fontSize: 8,
      fontWeight: '800',
      marginTop: 4,
    },

    directoryPaymentPaid: {
      color: '#16815E',
    },

    directoryPaymentDue: {
      color: '#B76C12',
    },

    kpiIcon: {
      width: 33,
      height: 33,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 10,
    },

    kpiIconText: {
      fontSize: 9,
      fontWeight: '900',
    },

    kpiNumber: {
      color: colors.ink,
      fontSize: 26,
      lineHeight: 30,
      fontWeight: '900',
    },

    kpiLabel: {
      color: colors.ink,
      fontSize: 11,
      fontWeight: '800',
      marginTop: 2,
    },

    kpiSmallLabel: {
      color: '#98A5AD',
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.8,
      marginTop: 4,
    },

    revenueLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginTop: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#DDE7E8',
    },

    revenueLinkText: {
      flex: 1,
    },

    revenueLinkTitle: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: '800',
    },

    revenueLinkSubtitle: {
      color: colors.muted,
      fontSize: 10,
      marginTop: 3,
    },

    revenueLinkArrow: {
      color: '#087A66',
      fontSize: 23,
      marginLeft: 12,
    },

    numberBadge: {
      width: 31,
      height: 31,
      borderRadius: 10,
      backgroundColor:
        '#FFF4DF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 1,
    },

    numberBadgeText: {
      color: '#B87816',
      fontSize: 11,
      fontWeight: '900',
    },

    alertBadge: {
      minWidth: 31,
      height: 31,
      borderRadius: 10,
      backgroundColor:
        '#FCE7EA',
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 8,
    },

    alertBadgeText: {
      color: '#A62F3D',
      fontSize: 11,
      fontWeight: '900',
    },

    doctorCount: {
      color: colors.muted,
      fontSize: 9.5,
      fontWeight: '800',
      marginBottom: 3,
    },

    notificationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EDF2F5',
    },

    notificationIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    notificationPayment: {
      backgroundColor:
        '#FFF4DF',
    },

    notificationAccess: {
      backgroundColor:
        '#FCE7EA',
    },

    notificationInfo: {
      backgroundColor:
        '#EAF7FA',
    },

    notificationIconText: {
      fontSize: 14,
      fontWeight: '900',
    },

    notificationPaymentText: {
      color: '#B87816',
    },

    notificationAccessText: {
      color: '#A62F3D',
    },

    notificationInfoText: {
      color: colors.cyan,
    },

    notificationContent: {
      flex: 1,
      minWidth: 0,
    },

    notificationTitle: {
      color: colors.ink,
      fontSize: 11.5,
      fontWeight: '900',
    },

    notificationText: {
      color: colors.muted,
      fontSize: 9.5,
      lineHeight: 14,
      marginTop: 3,
    },

    notificationDate: {
      color: '#98A5AD',
      fontSize: 8,
      marginTop: 5,
    },

    notificationDelete: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: '#FFF1F2',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },

    notificationDeleteText: {
      color: '#A62F3D',
      fontSize: 22,
      lineHeight: 25,
      fontWeight: '600',
    },

    requestItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EDF2F5',
    },

    accessRequestItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EDF2F5',
    },

    requestHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    requestAvatar: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor:
        '#EAF7FA',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    requestAvatarText: {
      color: colors.cyan,
      fontSize: 15,
      fontWeight: '900',
    },

    requestDetails: {
      flex: 1,
      minWidth: 0,
    },

    requestName: {
      color: colors.ink,
      fontSize: 13.5,
      fontWeight: '900',
    },

    requestEmail: {
      color: colors.muted,
      fontSize: 10,
      marginTop: 3,
    },

    pendingBadge: {
      backgroundColor:
        '#FFF4DF',
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginLeft: 6,
    },

    pendingText: {
      color: '#B87816',
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.6,
    },

    accessPendingBadge: {
      backgroundColor:
        '#FCE7EA',
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginLeft: 6,
    },

    accessPendingText: {
      color: '#A62F3D',
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.6,
    },

    accessRequestText: {
      color: colors.muted,
      fontSize: 10.5,
      lineHeight: 16,
      marginTop: 11,
    },

    paymentProofActions: {
      marginTop: 11,
    },

    proofViewButton: {
      minHeight: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#CDE7DC',
      backgroundColor: '#F2FAF6',
      paddingHorizontal: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },

    proofViewIcon: {
      color: '#147A58',
      fontSize: 17,
      marginRight: 7,
    },

    proofViewText: {
      color: '#147A58',
      fontSize: 10,
      fontWeight: '800',
    },

    proofPaidButton: {
      width: '100%',
    },

    proofMissing: {
      backgroundColor: '#F7F9FA',
      borderRadius: 9,
      padding: 10,
      marginTop: 10,
    },

    proofMissingText: {
      color: '#71808A',
      fontSize: 9,
      fontWeight: '700',
    },

    specialization: {
      backgroundColor:
        '#F7FAFC',
      borderRadius: 10,
      paddingHorizontal: 11,
      paddingVertical: 9,
      marginTop: 12,
    },

    specializationLabel: {
      color: '#98A5AD',
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 1,
    },

    specializationValue: {
      color: colors.ink,
      fontSize: 11,
      fontWeight: '800',
      marginTop: 2,
    },

    requestButtons: {
      flexDirection: 'row',
      marginTop: 11,
      marginHorizontal: -4,
    },

    buttonHalf: {
      flex: 1,
      marginHorizontal: 4,
    },

    doctorItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EDF2F5',
    },

    doctorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    doctorAvatar: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        '#102A38',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    doctorAvatarText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
    },

    doctorDetails: {
      flex: 1,
      minWidth: 0,
    },

    doctorName: {
      color: colors.ink,
      fontSize: 13.5,
      fontWeight: '900',
    },

    doctorEmail: {
      color: colors.muted,
      fontSize: 10,
      marginTop: 3,
    },

    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 5,
      marginLeft: 5,
    },

    activeBadge: {
      backgroundColor:
        '#E8F8F1',
    },

    removedBadge: {
      backgroundColor:
        '#F1F3F5',
    },

    statusDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      marginRight: 5,
    },

    activeDot: {
      backgroundColor:
        '#20A77A',
    },

    removedDot: {
      backgroundColor:
        '#87939A',
    },

    statusText: {
      fontSize: 6.5,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    activeText: {
      color: '#188A67',
    },

    removedText: {
      color: '#6D777D',
    },

    doctorMetaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      marginHorizontal: -3,
    },

    metaBox: {
      width: '50%',
      backgroundColor:
        '#F7FAFC',
      borderWidth: 1,
      borderColor:
        '#E6EDF1',
      borderRadius: 10,
      paddingHorizontal: 9,
      paddingVertical: 9,
      marginHorizontal: 3,
      marginBottom: 6,
      flexBasis: '47%',
      flexGrow: 1,
    },

    metaLabel: {
      color: '#98A5AD',
      fontSize: 6.5,
      fontWeight: '900',
      letterSpacing: 0.6,
    },

    metaValue: {
      color: colors.ink,
      fontSize: 9.5,
      fontWeight: '900',
      marginTop: 3,
    },

    paidValue: {
      color: '#188A67',
    },

    dueValue: {
      color: '#A62F3D',
    },

    pendingValue: {
      color: '#B87816',
    },

    paymentDueBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#FFF8EB',
      borderWidth: 1,
      borderColor:
        '#F3DFC0',
      borderRadius: 13,
      padding: 10,
      marginTop: 7,
    },

    paymentDueIcon: {
      width: 33,
      height: 33,
      borderRadius: 10,
      backgroundColor:
        '#FFF0CE',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 9,
    },

    paymentDueIconText: {
      color: '#B87816',
      fontSize: 13,
      fontWeight: '900',
    },

    paymentDueContent: {
      flex: 1,
    },

    paymentDueTitle: {
      color: '#94631B',
      fontSize: 10.5,
      fontWeight: '900',
    },

    paymentDueText: {
      color: '#A17D46',
      fontSize: 8.5,
      lineHeight: 13,
      marginTop: 2,
    },
    profileRequestBox: {
      backgroundColor: '#F0F8F5',
      borderWidth: 1,
      borderColor: '#CFE6DC',
      borderRadius: 12,
      padding: 11,
      marginTop: 10,
    },
    profileRequestHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileRequestDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#16805D',
      marginRight: 7,
    },
    profileRequestTitle: {
      color: '#147A58',
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.6,
    },
    profileRequestMessage: {
      color: '#526676',
      fontSize: 10,
      lineHeight: 15,
      marginTop: 7,
    },
    profileProofButton: {
      alignSelf: 'flex-start',
      paddingVertical: 8,
    },
    profileProofText: {
      color: '#147A58',
      fontSize: 9,
      fontWeight: '800',
    },
    profileProofMissing: {
      color: '#71808A',
      fontSize: 8,
      marginTop: 7,
    },

    profileRequestActions: {
      flexDirection: 'row',
      marginTop: 8,
      marginHorizontal: -3,
    },

    profileRequestAction: {
      flex: 1,
      marginHorizontal: 3,
    },

    analyticsButton: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#F5FAFC',
      borderWidth: 1,
      borderColor:
        '#E2ECF0',
      borderRadius: 14,
      paddingHorizontal: 12,
      marginTop: 13,
    },

    analyticsIcon: {
      width: 33,
      height: 33,
      borderRadius: 10,
      backgroundColor:
        '#E7F7FA',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    analyticsIconText: {
      color: colors.cyan,
      fontSize: 16,
      fontWeight: '900',
    },

    analyticsText: {
      flex: 1,
    },

    analyticsTitle: {
      color: colors.ink,
      fontSize: 11.5,
      fontWeight: '900',
    },

    analyticsSubtitle: {
      color: colors.muted,
      fontSize: 9,
      marginTop: 2,
    },

    arrow: {
      color: colors.cyan,
      fontSize: 24,
      fontWeight: '700',
      marginLeft: 7,
    },

    pressed: {
      opacity: 0.72,
      transform: [
        {
          scale: 0.985,
        },
      ],
    },

    paymentActions: {
      flexDirection: 'row',
      marginTop: 9,
      marginHorizontal: -4,
    },

    doctorActions: {
      flexDirection: 'row',
      marginTop: 8,
      marginHorizontal: -4,
    },

    actionButton: {
      flex: 1,
      marginHorizontal: 4,
    },

    deleteBox: {
      backgroundColor:
        '#FFF8F8',
      borderWidth: 1,
      borderColor:
        '#F1D0D5',
      borderRadius: 15,
      padding: 13,
      marginTop: 10,
    },

    deleteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    warningIcon: {
      width: 35,
      height: 35,
      borderRadius: 11,
      backgroundColor:
        '#FCE7EA',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    warningText: {
      color: colors.danger,
      fontSize: 17,
      fontWeight: '900',
    },

    deleteHeaderText: {
      flex: 1,
    },

    deleteTitle: {
      color: '#8E2633',
      fontSize: 12.5,
      fontWeight: '900',
    },

    deleteSubtitle: {
      color: '#A56B73',
      fontSize: 9.5,
      marginTop: 2,
    },

    deleteDescription: {
      color: '#6D5055',
      fontSize: 10.5,
      lineHeight: 16,
      marginTop: 10,
    },

    deleteActions: {
      flexDirection: 'row',
      marginTop: 10,
      marginHorizontal: -4,
    },

    deleteProgress: {
      color: colors.danger,
      fontSize: 10,
      fontWeight: '700',
      marginTop: 8,
    },

    deleteError: {
      color: colors.danger,
      fontSize: 10,
      lineHeight: 15,
      marginTop: 8,
    },

    emptyState: {
      alignItems: 'center',
      paddingVertical: 30,
      paddingHorizontal: 20,
    },

    emptyIcon: {
      width: 45,
      height: 45,
      borderRadius: 14,
      backgroundColor:
        '#F1F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 10,
    },

    emptyIconSuccess: {
      backgroundColor:
        '#E8F8F1',
    },

    emptyIconText: {
      color: '#9AA6AD',
      fontSize: 16,
      fontWeight: '900',
    },

    emptyIconTextSuccess: {
      color: '#20A77A',
    },

    emptyTitle: {
      color: colors.ink,
      fontSize: 13.5,
      fontWeight: '900',
      textAlign: 'center',
    },

    emptyText: {
      color: colors.muted,
      fontSize: 10.5,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 4,
      maxWidth: 300,
    },

    adminInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#F6FAFC',
      borderWidth: 1,
      borderColor:
        '#E4EDF1',
      borderRadius: 15,
      padding: 13,
      marginTop: 20,
    },

    infoIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor:
        '#E7F7FA',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    infoIconText: {
      color: colors.cyan,
      fontSize: 16,
      fontWeight: '900',
    },

    infoContent: {
      flex: 1,
    },

    infoTitle: {
      color: colors.ink,
      fontSize: 11,
      fontWeight: '900',
    },

    infoText: {
      color: colors.muted,
      fontSize: 9.5,
      lineHeight: 15,
      marginTop: 2,
    },

    signOut: {
      marginTop: 22,
      marginBottom: 8,
    },

    noBorder: {
      borderBottomWidth: 0,
    },

  });

export default styles;
