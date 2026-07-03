import { Input } from '../ui/Input'

interface GuestIdentityFieldsProps {
  fullName: string
  email: string
  errors: {
    fullName?: string
    email?: string
  }
  onFullNameChange: (value: string) => void
  onEmailChange: (value: string) => void
}

export function GuestIdentityFields({
  fullName,
  email,
  errors,
  onFullNameChange,
  onEmailChange,
}: GuestIdentityFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Nom complet"
        required
        value={fullName}
        onChange={(event) => onFullNameChange(event.target.value)}
        placeholder="Votre nom"
        error={errors.fullName}
      />
      <Input
        label="Email"
        required
        type="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="vous@exemple.com"
        error={errors.email}
      />
    </div>
  )
}
