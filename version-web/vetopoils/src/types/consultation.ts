export interface Animal {
  name: string
  breed: string
  age: number
}

export interface GuestIdentity {
  fullName: string
  email: string
}

export interface ConsultationFormData {
  veterinarianName: string
  clinic: string
  visitDate: string
  nextAppointment: string
  diagnosis: string
  notes: string
  guestIdentity?: GuestIdentity
}

export interface ConsultationPayload extends ConsultationFormData {
  animalName?: string
  isGuest: boolean
}
