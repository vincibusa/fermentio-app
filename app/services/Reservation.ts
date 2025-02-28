import { database } from '../firebase-config';

export interface Reservation {
  id?: string;
  fullName: string;
  phone: string;
  date: string;   // formato "YYYY-MM-DD"
  time: string;   // formato "HH:mm" (es. "19:00", "19:30", ecc.)
  seats: number;
  specialRequests?: string;
}

export interface Shift {
  time: string;           // Es. "19:00", "20:00", ecc.
  enabled: boolean;       // Indica se il turno è attivo (sbloccato) oppure no
  maxReservations: number; // Numero massimo di posti prenotabili (default 15)
}

// Array costante con tutti gli orari desiderati
export const allTimes = [
  "19:00", "19:15", "19:30", "19:45", 
  "20:00", "20:15", "20:30", "20:45", 
  "21:00", "21:15", "21:30"
];

/**
 * Inizializza gli shift di default per una data specifica.
 * Per ogni orario in allTimes crea uno Shift; di default vengono abilitati solo "19:00", "20:00" e "21:30".
 */
export const initializeShiftsForDate = async (date: string): Promise<void> => {
  const shiftsRef = database.ref(`shifts/${date}`);
  const defaultShifts: Shift[] = allTimes.map((time) => {
    // Imposta attivi di default solo 19:00, 20:00 e 21:30
    const enabled = (time === "19:00" || time === "20:00" || time === "21:30");
    return { time, enabled, maxReservations: 15 };
  });
  for (const shift of defaultShifts) {
    await shiftsRef.child(shift.time).set(shift);
  }
};

/**
 * Aggiorna le impostazioni di un turno per una data specifica.
 */
export const updateShift = async (
  date: string,
  time: string,
  shift: Partial<Shift>
): Promise<void> => {
  const shiftRef = database.ref(`shifts/${date}/${time}`);
  await shiftRef.update(shift);
};

/**
 * Recupera tutti gli shift per una data specifica.
 */
export const getShiftsForDate = async (date: string): Promise<Shift[]> => {
  const shiftsRef = database.ref(`shifts/${date}`);
  const snapshot = await shiftsRef.once('value');
  const shifts: Shift[] = [];
  snapshot.forEach(childSnapshot => {
    shifts.push(childSnapshot.val());
  });
  return shifts;
};

/**
 * Aggiunge una prenotazione, controllando che il turno esista, sia abilitato e che il numero totale di posti prenotati non superi il limite.
 */
export const addReservation = async (reservation: Reservation): Promise<string | null> => {
  try {
    // Verifica che il turno esista e sia abilitato
    const shiftRef = database.ref(`shifts/${reservation.date}/${reservation.time}`);
    const shiftSnapshot = await shiftRef.once('value');
    if (!shiftSnapshot.exists() || !shiftSnapshot.val().enabled) {
      throw new Error('Turno non disponibile');
    }
    const shift: Shift = shiftSnapshot.val();

    // Somma i posti prenotati per quel turno nella data
    const reservationsRef = database.ref('reservations');
    const snapshot = await reservationsRef.orderByChild('date').equalTo(reservation.date).once('value');
    let totalSeats = 0;
    snapshot.forEach(childSnapshot => {
      const res: Reservation = childSnapshot.val();
      if (res.time === reservation.time) {
        totalSeats += res.seats;
      }
    });

    // Se superiamo il limite, genera un errore
    if (totalSeats + reservation.seats > shift.maxReservations) {
      throw new Error('Turno al completo');
    }

    // Aggiunge la prenotazione
    const newReservationRef = reservationsRef.push();
    await newReservationRef.set(reservation);
    return newReservationRef.key;
  } catch (error) {
    console.error('Errore durante l\'aggiunta della prenotazione: ', error);
    throw error;
  }
};

/**
 * Sottoscrizione in tempo reale alle prenotazioni.
 */
export const subscribeToReservations = (
  callback: (reservations: Reservation[]) => void
): (() => void) => {
  const reservationsRef = database.ref('reservations');
  const listener = reservationsRef.on('value', (snapshot) => {
    const reservations: Reservation[] = [];
    snapshot.forEach((childSnapshot) => {
      const reservation: Reservation = childSnapshot.val();
      reservation.id = childSnapshot.key ?? "";
      reservations.push(reservation);
    });
    callback(reservations);
  });
  return () => {
    reservationsRef.off('value', listener);
  };
};

/**
 * Aggiorna una prenotazione esistente.
 */
export const updateReservation = async (key: string, reservation: Reservation): Promise<void> => {
  try {
    const reservationRef = database.ref(`reservations/${key}`);
    await reservationRef.update(reservation);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della prenotazione: ', error);
    throw error;
  }
};

/**
 * Elimina una prenotazione dato il suo key.
 */
export const deleteReservation = async (key: string): Promise<void> => {
  try {
    const reservationRef = database.ref(`reservations/${key}`);
    await reservationRef.remove();
  } catch (error) {
    console.error('Errore durante l\'eliminazione della prenotazione: ', error);
    throw error;
  }
};