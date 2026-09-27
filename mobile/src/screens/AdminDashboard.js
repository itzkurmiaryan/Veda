import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { api } from '../api/api';
import { Button, Card, FadeIn, Loading, Screen, colors } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard({ navigation }) {
  const { doctor, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDoctorId, setDeleteDoctorId] = useState(null);
  const [deletingDoctorId, setDeletingDoctorId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [requestsResponse, doctorsResponse, overviewResponse] = await Promise.all([
        api.get('/admin/requests'),
        api.get('/admin/doctors'),
        api.get('/analytics/overview'),
      ]);
      setRequests(requestsResponse.data.data);
      setDoctors(doctorsResponse.data.data);
      setOverview(overviewResponse.data.data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async path => {
    try {
      await api.post(path);
      await load();
    } catch (error) {
      Alert.alert('Action failed', error.response?.data?.message || error.message);
    }
  };

  const access = async doctorItem => {
    try {
      await api.patch(`/admin/doctors/${doctorItem._id}/access`, {
        active: !doctorItem.active,
      });
      await load();
    } catch (error) {
      Alert.alert('Action failed', error.response?.data?.message || error.message);
    }
  };

  const openDeleteConfirmation = doctorItem => {
    setDeleteError('');
    setDeleteDoctorId(doctorItem._id);
  };

  const cancelDelete = () => {
    if (deletingDoctorId) return;
    setDeleteDoctorId(null);
    setDeleteError('');
  };

  const deleteDoctor = async doctorItem => {
    if (!doctorItem?._id || deletingDoctorId) return;

    try {
      setDeletingDoctorId(doctorItem._id);
      setDeleteError('');
      await api.delete(`/admin/doctors/${doctorItem._id}`);
      setDeleteDoctorId(null);
      await load();
    } catch (error) {
      setDeleteError(error.response?.data?.message || error.message || 'Unable to delete doctor.');
    } finally {
      setDeletingDoctorId(null);
    }
  };

  return (
    <Screen scroll>
      <FadeIn>
        <View style={{ paddingTop: 10, paddingBottom: 18 }}>
          <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 1, color: colors.cyan }}>
            VEDA  /  ADMIN CONSOLE
          </Text>
          <Text style={{ fontSize: 32, lineHeight: 38, fontWeight: '900', color: colors.ink, marginTop: 8 }}>
            Good morning, {doctor?.name?.split(' ')[0] || 'Admin'}
          </Text>
          <Text style={{ fontSize: 15, color: colors.muted, marginTop: 5 }}>
            Keep your clinical network moving.
          </Text>
        </View>

        <Button title="Edit admin profile" secondary onPress={() => navigation.navigate('Profile')} />

        {loading ? <Loading /> : (
          <>
            <Card accent>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink, marginBottom: 14 }}>
                Network overview
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {[
                  ['Doctors', overview?.totalDoctors],
                  ['Active', overview?.activeDoctors],
                  ['Access removed', overview?.inactiveDoctors],
                  ['Pending requests', overview?.pendingRequests],
                  ['All patients', overview?.totalPatients],
                  ['All visits', overview?.totalVisits],
                ].map(([label, value]) => (
                  <View key={label} style={{ width: '50%', paddingVertical: 9 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' }}>
                      {label}
                    </Text>
                    <Text style={{ fontSize: 26, fontWeight: '900', color: colors.ink, marginTop: 2 }}>
                      {value || 0}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>
                Pending requests <Text style={{ color: colors.blue }}>- {requests.length}</Text>
              </Text>
              {requests.length === 0 ? (
                <Text style={{ color: colors.muted, marginTop: 12 }}>No requests waiting for review.</Text>
              ) : requests.map(request => (
                <View key={request._id} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF3F8' }}>
                  <Text style={{ fontWeight: '900', color: colors.ink }}>{request.name}</Text>
                  <Text style={{ color: colors.muted, marginTop: 3 }}>
                    {request.email}  -  {request.specialization || 'Doctor'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <View style={{ flex: 1 }}><Button title="Approve" onPress={() => act(`/admin/requests/${request._id}/approve`)} /></View>
                    <View style={{ flex: 1 }}><Button title="Reject" danger onPress={() => act(`/admin/requests/${request._id}/reject`)} /></View>
                  </View>
                </View>
              ))}
            </Card>

            <Card>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>
                Doctor directory <Text style={{ color: colors.blue }}>- {doctors.length}</Text>
              </Text>
              {doctors.map(doctorItem => {
                const isConfirming = deleteDoctorId === doctorItem._id;
                const isDeleting = deletingDoctorId === doctorItem._id;

                return (
                  <View key={doctorItem._id} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF3F8' }}>
                    <Text style={{ fontWeight: '900', color: colors.ink }}>{doctorItem.name}</Text>
                    <Text style={{ color: colors.muted, marginTop: 3 }}>
                      {doctorItem.email}  -  {doctorItem.active ? 'Active' : 'Access removed'}
                    </Text>
                    <Button title="View analytics / edit profile" onPress={() => navigation.navigate('AdminDoctorEdit', { doctor: doctorItem })} />
                    <Button title={doctorItem.active ? 'Remove access' : 'Restore access'} secondary onPress={() => access(doctorItem)} />

                    {!isConfirming ? (
                      <Button title="Delete doctor" danger onPress={() => openDeleteConfirmation(doctorItem)} />
                    ) : (
                      <View style={{ backgroundColor: '#FFF7F8', borderWidth: 1, borderColor: '#F4C5CD', borderRadius: 16, padding: 14, marginTop: 6 }}>
                        <Text style={{ color: colors.danger, fontSize: 17, fontWeight: '900', marginBottom: 8 }}>
                          Confirm permanent deletion
                        </Text>
                        <Text style={{ color: colors.ink, lineHeight: 21, marginBottom: 8 }}>
                          This will delete the doctor, all patients, and all prescriptions permanently.
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <View style={{ flex: 1 }}><Button title="CANCEL" secondary disabled={isDeleting} onPress={cancelDelete} /></View>
                          <View style={{ flex: 1 }}><Button title={isDeleting ? 'DELETING...' : 'YES, DELETE'} danger disabled={isDeleting} onPress={() => deleteDoctor(doctorItem)} /></View>
                        </View>
                        {isDeleting ? <Text style={{ color: colors.danger, fontWeight: '700', marginTop: 8 }}>Deleting doctor and related records...</Text> : null}
                        {deleteError ? <Text style={{ color: colors.danger, lineHeight: 20, marginTop: 8 }}>{deleteError}</Text> : null}
                      </View>
                    )}
                  </View>
                );
              })}
            </Card>
          </>
        )}

        <Button title="Sign out" secondary onPress={logout} />
      </FadeIn>
    </Screen>
  );
}
