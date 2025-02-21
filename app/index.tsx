import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Modal, 
  StyleSheet, 
  Platform, 
  KeyboardAvoidingView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { database } from './firebase-config';
import {
  Reservation,
  subscribeToReservations,
  updateReservation,
  deleteReservation,
  addReservation
} from './services/Reservation';

// Definizione della palette di colori (derivata dal file Tailwind)
const colors = {
  eden: "#0c4b43",           // primary.default
  iron: "#d9d9db",           // background
  mojo: "#bf4a3a",           // accent.default e ring
  kabul: "#63483f",          // secondary.default
  mineralGreen: "#436464",
  grannySmith: "#7c9b9b",     // muted.default
  codGray: "#0c0c0c",        // darkBg
  gumbo: "#80a4a4",          // border e input
  cascade: "#84a49c",        // chart 1
  lisbonBrown: "#3e391c",    // dark.card.default
  foreground: "#020817",     // foreground
  white: "#FFFFFF",
  destructive: "#FF4C4C",
  mutedForeground: "#6D7074",
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

interface ReservationFormData {
  fullName: string;
  phone: string;
  date: string;
  time: string;
  seats: number;
  specialRequests?: string;
}

const ReservationPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [formData, setFormData] = useState<ReservationFormData>({
    fullName: '',
    phone: '',
    date: '',
    time: '',
    seats: 1,
  });
  const [filterDate, setFilterDate] = useState(new Date());
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToReservations((reservationsData) => {
      setReservations(reservationsData);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const registerForNotifications = async () => {
      if (Constants.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          alert('Permission for notifications not granted!');
        }
      } else {
        alert('Must use physical device for Push Notifications');
      }
    };

    registerForNotifications();

    const reservationsRef = database.ref('reservations');
    let isInitialLoad = true;
    
    reservationsRef.once('value', () => {
      isInitialLoad = false;
    });

    const onChildAdded = reservationsRef.on('child_added', (snapshot) => {
      if (isInitialLoad) return;
      const newReservation: Reservation = snapshot.val();
      newReservation.id = snapshot.key || '';

      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Nuova Prenotazione!',
          body: `Prenotazione da ${newReservation.fullName} per il ${newReservation.date}`,
        },
        trigger: null,
      });
    });

    return () => {
      reservationsRef.off('child_added', onChildAdded);
    };
  }, []);

  const handleEdit = useCallback((reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      fullName: reservation.fullName,
      phone: reservation.phone,
      date: format(new Date(reservation.date), 'yyyy-MM-dd'),
      time: reservation.time,
      seats: reservation.seats,
      specialRequests: reservation.specialRequests || '',
    });
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDeleteModalOpen(true);
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!formData.fullName || !formData.phone || !formData.date || !formData.time || !formData.seats) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all fields',
      });
      return;
    }

    if (selectedReservation && selectedReservation.id) {
      const updatedReservation: Reservation = {
        ...selectedReservation,
        ...formData,
        date: formData.date,
      };
      try {
        await updateReservation(selectedReservation.id, updatedReservation);
        setReservations((prev) =>
          prev.map((res) => (res.id === selectedReservation.id ? updatedReservation : res))
        );
        Toast.show({
          type: 'success',
          text1: 'Prenotazione modificata',
        });
        setIsEditModalOpen(false);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error updating reservation',
        });
      }
    }
  }, [formData, selectedReservation]);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedReservation && selectedReservation.id) {
      try {
        await deleteReservation(selectedReservation.id.toString());
        setReservations((prev) =>
          prev.filter((res) => res.id !== selectedReservation.id)
        );
        Toast.show({
          type: 'success',
          text1: 'Prenotazione Cancellata',
        });
        setIsDeleteModalOpen(false);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error deleting reservation',
        });
      }
    }
  }, [selectedReservation]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>Prenotazioni</Text>
          <TouchableOpacity 
            style={styles.filterDateButton}
            onPress={() => setShowFilterDatePicker(true)}
          >
            <Text style={styles.filterDateText}>
              {format(filterDate, 'MMMM dd, yyyy')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reservationsGrid}>
          {reservations
            .filter(reservation => reservation.date === format(filterDate, 'yyyy-MM-dd'))
            .map((reservation) => (
            <View key={reservation.id} style={styles.reservationCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{reservation.fullName}</Text>
                  <Text style={styles.cardSubtitle}>{reservation.phone}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleEdit(reservation)}
                    style={styles.editButton}
                  >
                    <Feather name="edit-2" size={20} color={colors.eden} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(reservation)}
                    style={styles.deleteButton}
                  >
                    <Feather name="trash-2" size={20} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={16} color={colors.mutedForeground} />
                  <Text style={styles.detailText}>
                    {format(new Date(reservation.date), 'MMMM dd, yyyy')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Feather name="clock" size={16} color={colors.mutedForeground} />
                  <Text style={styles.detailText}>{reservation.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Feather name="users" size={16} color={colors.mutedForeground} />
                  <Text style={styles.detailText}>x {reservation.seats}</Text>
                </View>
                {reservation.specialRequests && (
                  <Text style={styles.specialRequests}>{reservation.specialRequests}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <DateTimePickerModal
        isVisible={showFilterDatePicker}
        mode="date"
        date={filterDate}
        onConfirm={(selectedDate) => {
          setFilterDate(selectedDate);
          setShowFilterDatePicker(false);
        }}
        onCancel={() => setShowFilterDatePicker(false)}
      />

      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Reservation</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholderTextColor={colors.mutedForeground}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor={colors.mutedForeground}
              />
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {formData.date || 'Select Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {formData.time || 'Select Time'}
                </Text>
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                date={formData.date ? new Date(formData.date) : new Date()}
                onConfirm={(selectedDate) => {
                  setFormData({
                    ...formData,
                    date: format(selectedDate, 'yyyy-MM-dd'),
                  });
                  setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
              />

              <DateTimePickerModal
                isVisible={showTimePicker}
                mode="time"
                date={new Date()}
                onConfirm={(selectedTime) => {
                  setFormData({
                    ...formData,
                    time: format(selectedTime, 'HH:mm'),
                  });
                  setShowTimePicker(false);
                }}
                onCancel={() => setShowTimePicker(false)}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditModalOpen(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={handleUpdate}
                >
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={isDeleteModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this reservation?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDeleteModalOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: colors.destructive }]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.updateButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.iron 
  },
  scrollContent: { padding: 16 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: { 
    fontSize: 24, 
    fontWeight: 'bold',
    color: colors.eden,
  },
  filterDateButton: {
    borderWidth: 1,
    borderColor: colors.gumbo,
    borderRadius: 8,
    padding: 8,
    backgroundColor: colors.white,
  },
  filterDateText: { color: colors.foreground },
  reservationsGrid: { gap: 16 },
  reservationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.codGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 16 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '600',
    color: colors.foreground,
  },
  cardSubtitle: { color: colors.mutedForeground },
  actionButtons: { flexDirection: 'row', gap: 8 },
  editButton: { padding: 8 },
  deleteButton: { padding: 8 },
  cardDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { color: colors.foreground },
  specialRequests: { color: colors.foreground, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  modalContent: { 
    backgroundColor: colors.white, 
    borderRadius: 12, 
    padding: 16, 
    width: '100%' 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 16, 
    color: colors.foreground,
  },
  modalText: { 
    color: colors.mutedForeground, 
    marginBottom: 24 
  },
  input: { 
    borderWidth: 1, 
    borderColor: colors.gumbo, 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 16, 
    color: colors.foreground, 
    backgroundColor: colors.white 
  },
  pickerButton: { 
    borderWidth: 1, 
    borderColor: colors.gumbo, 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 16, 
    backgroundColor: colors.white 
  },
  pickerButtonText: { color: colors.foreground },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  cancelButton: { 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: colors.gumbo, 
    backgroundColor: colors.white 
  },
  cancelButtonText: { color: colors.foreground },
  updateButton: { 
    padding: 12, 
    borderRadius: 8, 
    backgroundColor: colors.mojo 
  },
  updateButtonText: { color: colors.white },
});

export default ReservationPage;
