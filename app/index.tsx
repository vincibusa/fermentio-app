import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  StyleSheet,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
import {
  Reservation,
  Shift,
  subscribeToReservations,
  updateReservation,
  deleteReservation,
  getShiftsForDate,
  updateShift,
  initializeShiftsForDate,
  allTimes,
} from "./services/Reservation";

// Ispirazione dai valori del Tailwind config
const COLORS = {
  primary: "#0c4b43", // Eden
  primaryForeground: "#FFFFFF",
  secondary: "#63483f", // Kabul
  secondaryForeground: "#FFFFFF",
  accent: "#bf4a3a", // Mojo
  accentForeground: "#FFFFFF",
  background: "#d9d9db", // Iron
  foreground: "#020817",
  border: "#80a4a4", // Gumbo
  card: "#FFFFFF",
  codGray: "#0c0c0c",
};

const FONTS = {
  heading: "Gambetta",
  body: "Inter",
};

const FONT_SIZES = {
  heading: 36,
  body: 14,
};

// Correzione: Definire fontWeight come tipo valido per React Native
type FontWeightType = "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

const FONT_WEIGHTS: Record<string, FontWeightType> = {
  heading: "700",
  body: "600",
};

// Creazione di stili riutilizzabili con StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: COLORS.background
  },
  header: {
    padding: 16, 
    backgroundColor: COLORS.primary, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border
  },
  headerText: {
    fontSize: FONT_SIZES.heading, 
    fontFamily: FONTS.heading, 
    fontWeight: FONT_WEIGHTS.heading, 
    color: COLORS.primaryForeground, 
    marginBottom: 16
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: FONT_SIZES.body, 
    fontFamily: FONTS.body, 
    color: COLORS.foreground
  },
  toggleButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  toggleButtonText: {
    color: COLORS.accentForeground, 
    fontFamily: FONTS.body, 
    fontWeight: FONT_WEIGHTS.body, 
    fontSize: FONT_SIZES.body
  },
  emptyListContainer: {
    padding: 32, 
    alignItems: "center", 
    justifyContent: "center"
  },
  reservationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.codGray,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: 12
  },
  cardName: {
    fontSize: 18, 
    fontFamily: FONTS.body, 
    fontWeight: FONT_WEIGHTS.body, 
    color: COLORS.foreground
  },
  cardPhone: {
    fontSize: 14, 
    fontFamily: FONTS.body, 
    color: COLORS.foreground, 
    marginTop: 4
  },
  actionIcon: {
    padding: 8
  },
  infoRow: {
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 4
  },
  infoIcon: {
    marginRight: 8
  },
  infoText: {
    fontSize: FONT_SIZES.body, 
    fontFamily: FONTS.body, 
    color: COLORS.foreground
  },
  modalContainer: {
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center"
  },
  modalContent: {
    width: "90%", 
    backgroundColor: COLORS.card, 
    borderRadius: 12, 
    padding: 20, 
    maxHeight: "60%"
  },
  modalTitle: {
    fontSize: FONT_SIZES.heading, 
    fontFamily: FONTS.heading, 
    fontWeight: FONT_WEIGHTS.heading, 
    color: COLORS.foreground, 
    marginBottom: 16
  },
  optionItem: {
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border
  },
  closeButton: {
    marginTop: 16, 
    alignItems: "center", 
    padding: 12, 
    backgroundColor: COLORS.background, 
    borderRadius: 8
  },
  closeButtonText: {
    fontSize: FONT_SIZES.body, 
    fontFamily: FONTS.body, 
    fontWeight: FONT_WEIGHTS.body, 
    color: COLORS.foreground
  },
  formScrollView: {
    flexGrow: 1, 
    justifyContent: "center", 
    padding: 20
  },
  formContainer: {
    width: "90%", 
    backgroundColor: COLORS.card, 
    borderRadius: 12, 
    padding: 20, 
    maxHeight: "80%"
  },
  formField: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: FONT_SIZES.body, 
    fontFamily: FONTS.body, 
    color: COLORS.foreground, 
    marginBottom: 6
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.body,
    color: COLORS.foreground,
    backgroundColor: COLORS.background,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row", 
    justifyContent: "flex-end", 
    marginTop: 16
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.body, 
    fontFamily: FONTS.body, 
    fontWeight: FONT_WEIGHTS.body, 
    color: COLORS.primaryForeground
  },
  deleteButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 16,
  },
  confirmationText: {
    fontSize: FONT_SIZES.body, 
    fontFamily: FONTS.body, 
    color: COLORS.foreground, 
    marginBottom: 20
  },
});

const ReservationScreen = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<string>(allTimes[0]);

  // Stati per gestire modali e picker
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isHeaderDatePickerVisible, setIsHeaderDatePickerVisible] = useState<boolean>(false);
  const [isFormDatePickerVisible, setIsFormDatePickerVisible] = useState<boolean>(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState<boolean>(false);
  const [isShiftPickerVisible, setIsShiftPickerVisible] = useState<boolean>(false);
  const [isSeatsPickerVisible, setIsSeatsPickerVisible] = useState<boolean>(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Form data per edit/aggiunta
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    date: new Date(),
    time: allTimes[0],
    seats: 1,
    specialRequests: "",
  });

  useEffect(() => {
    const unsubscribe = subscribeToReservations((reservationsData) => {
      setReservations(reservationsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadShifts = async () => {
      try {
        const dateString = format(selectedDate, "yyyy-MM-dd");
        let shiftsData = await getShiftsForDate(dateString);
        if (shiftsData.length === 0) {
          await initializeShiftsForDate(dateString);
          shiftsData = await getShiftsForDate(dateString);
        }
        setShifts(shiftsData);
        if (!shiftsData.find((s) => s.time === selectedShift)) {
          setSelectedShift(allTimes[0]);
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load shifts");
      }
    };
    loadShifts();
  }, [selectedDate]);

  const filteredReservations = reservations.filter(
    (reservation) => reservation.date === format(selectedDate, "yyyy-MM-dd")
  );

  // Picker e modali
  const handleHeaderDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setIsHeaderDatePickerVisible(false);
  };

  const handleFormDateConfirm = (date: Date) => {
    setFormData({ ...formData, date });
    setIsFormDatePickerVisible(false);
  };

  const handleTimeConfirm = (time: Date) => {
    const hours = time.getHours().toString().padStart(2, "0");
    const minutes = time.getMinutes().toString().padStart(2, "0");
    setFormData({ ...formData, time: `${hours}:${minutes}` });
    setIsTimePickerVisible(false);
  };

  const handleShiftChange = (time: string) => {
    setSelectedShift(time);
    setIsShiftPickerVisible(false);
  };

  const toggleShiftStatus = async () => {
    try {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const currentShift = shifts.find((s) => s.time === selectedShift);
      const shiftToUpdate =
        currentShift || { time: selectedShift, enabled: false, maxReservations: 15 };
      await updateShift(dateString, selectedShift, { enabled: !shiftToUpdate.enabled });
      const updatedShifts = await getShiftsForDate(dateString);
      setShifts(updatedShifts);
      Alert.alert(
        "Success",
        `Orario ${selectedShift} ${!shiftToUpdate.enabled ? "attivato" : "bloccato"}`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update shift status");
    }
  };

  const handleEdit = useCallback((reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      fullName: reservation.fullName,
      phone: reservation.phone,
      date: new Date(reservation.date),
      time: reservation.time,
      seats: reservation.seats,
      specialRequests: reservation.specialRequests || "",
    });
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDeleteModalOpen(true);
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!formData.fullName || !formData.phone || !formData.time || !formData.seats) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (selectedReservation && selectedReservation.id) {
      const updatedReservation: Reservation = {
        ...selectedReservation,
        fullName: formData.fullName,
        phone: formData.phone,
        date: format(formData.date, "yyyy-MM-dd"),
        time: formData.time,
        seats: formData.seats,
        specialRequests: formData.specialRequests,
      };
      try {
        await updateReservation(selectedReservation.id, updatedReservation);
        setReservations((prev) =>
          prev.map((res) =>
            res.id === selectedReservation.id ? updatedReservation : res
          )
        );
        Alert.alert("Success", "Prenotaizone aggiornata con successo");
        setIsEditModalOpen(false);
      } catch (error) {
        Alert.alert("Error", "Errore durante l'aggiornamento della prenotazione");
      }
    }
  }, [formData, selectedReservation]);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedReservation && selectedReservation.id) {
      try {
        await deleteReservation(selectedReservation.id);
        setReservations((prev) =>
          prev.filter((res) => res.id !== selectedReservation.id)
        );
        Alert.alert("Success", "Prenotazione eliminata con successo");
        setIsDeleteModalOpen(false);
      } catch (error) {
        Alert.alert("Error", "Errore durante l'eliminazione della prenotazione");
      }
    } else {
      Alert.alert("Error", "Reservation ID is undefined");
    }
  }, [selectedReservation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Prenotazioni
        </Text>
        <View style={{ flexDirection: "column", marginBottom: 10 }}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setIsHeaderDatePickerVisible(true)}
          >
            <Feather name="calendar" size={18} color={COLORS.foreground} style={styles.infoIcon} />
            <Text style={styles.buttonText}>
              {format(selectedDate, "dd MMM yyyy")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setIsShiftPickerVisible(true)}
          >
            <Feather name="clock" size={18} color={COLORS.foreground} style={styles.infoIcon} />
            <Text style={styles.buttonText}>
              {selectedShift} {shifts.find((s) => s.time === selectedShift)?.enabled ? "(Attivo)" : "(Bloccato)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleShiftStatus}
          >
            <Text style={styles.toggleButtonText}>
              {shifts.find((s) => s.time === selectedShift)?.enabled ? "Blocca" : "Sblocca"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista prenotazioni */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {filteredReservations.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <Text style={styles.buttonText}>
              Nessuna prenotazione per questa data
            </Text>
          </View>
        ) : (
          filteredReservations.map((reservation) => (
            <View
              key={reservation.id}
              style={styles.reservationCard}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>
                    {reservation.fullName}
                  </Text>
                  <Text style={styles.cardPhone}>
                    {reservation.phone}
                  </Text>
                </View>
                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity onPress={() => handleEdit(reservation)} style={styles.actionIcon}>
                    <Feather name="edit-2" size={20} color={COLORS.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(reservation)} style={styles.actionIcon}>
                    <Feather name="trash-2" size={20} color={COLORS.accent} />
                  </TouchableOpacity>
                </View>
              </View>
              <View>
                <View style={styles.infoRow}>
                  <Feather name="calendar" size={16} color={COLORS.foreground} style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    {format(new Date(reservation.date), "MMMM dd, yyyy")}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="clock" size={16} color={COLORS.foreground} style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    {reservation.time}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="users" size={16} color={COLORS.foreground} style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    {reservation.seats} seats
                  </Text>
                </View>
                {reservation.specialRequests && (
                  <View style={styles.infoRow}>
                    <Feather name="info" size={16} color={COLORS.foreground} style={styles.infoIcon} />
                    <Text style={styles.infoText}>
                      {reservation.specialRequests}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Header Date Picker */}
      <DateTimePickerModal
        isVisible={isHeaderDatePickerVisible}
        mode="date"
        date={selectedDate}
        onConfirm={handleHeaderDateConfirm}
        onCancel={() => setIsHeaderDatePickerVisible(false)}
      />

      {/* Shift Picker Modal */}
      <Modal
        visible={isShiftPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsShiftPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select Shift
            </Text>
            <ScrollView>
              {allTimes.map((time) => {
                const shift = shifts.find((s) => s.time === time);
                const enabled = shift ? shift.enabled : false;
                return (
                  <TouchableOpacity
                    key={time}
                    style={styles.optionItem}
                    onPress={() => handleShiftChange(time)}
                  >
                    <Text style={styles.infoText}>
                      {time} {enabled ? "(Attivo)" : "(Bloccato)"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsShiftPickerVisible(false)}
            >
              <Text style={styles.closeButtonText}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Reservation Modal */}
      <Modal
        visible={isEditModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <ScrollView contentContainerStyle={styles.formScrollView}>
          <View style={styles.formContainer}>
            <Text style={styles.modalTitle}>
              Edit Reservation
            </Text>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>
                Full Name
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Full Name"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>
                Phone Number
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>
                Date
              </Text>
              <TouchableOpacity
                style={styles.textInput}
                onPress={() => setIsFormDatePickerVisible(true)}
              >
                <Text>{format(formData.date, "MMMM dd, yyyy")}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>
                Time
              </Text>
              <TouchableOpacity
                style={styles.textInput}
                onPress={() => setIsTimePickerVisible(true)}
              >
                <Text>{formData.time}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>
                Seats
              </Text>
              <TouchableOpacity
                style={styles.textInput}
                onPress={() => setIsSeatsPickerVisible(true)}
              >
                <Text>{formData.seats} seats</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>
                Special Requests
              </Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={formData.specialRequests}
                onChangeText={(text) => setFormData({ ...formData, specialRequests: text })}
                placeholder="Special Requests (optional)"
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditModalOpen(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleUpdate}
              >
                <Text style={styles.actionButtonText}>
                  Update
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Form Date Picker Modal */}
      <DateTimePickerModal
        isVisible={isFormDatePickerVisible}
        mode="date"
        date={formData.date}
        onConfirm={handleFormDateConfirm}
        onCancel={() => setIsFormDatePickerVisible(false)}
      />

      {/* Form Time Picker Modal */}
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        date={new Date(`2023-01-01T${formData.time}:00`)}
        onConfirm={handleTimeConfirm}
        onCancel={() => setIsTimePickerVisible(false)}
      />

      {/* Seats Picker Modal */}
      <Modal
        visible={isSeatsPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSeatsPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select Seats
            </Text>
            <ScrollView>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.optionItem}
                  onPress={() => {
                    setFormData({ ...formData, seats: num });
                    setIsSeatsPickerVisible(false);
                  }}
                >
                  <Text style={styles.buttonText}>
                    {num} seats
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsSeatsPickerVisible(false)}
            >
              <Text style={styles.closeButtonText}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Conferma eliminazione
            </Text>
            <Text style={styles.confirmationText}>
              Sei sicuro di voler eliminare questa prenotazione?
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDeleteModalOpen(false)}
              >
                <Text style={styles.buttonText}>Indietro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.actionButtonText}>Conferma</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ReservationScreen;