import { z } from 'zod';

export const patientSchema = z.object({
  name: z.string().min(3, { message: "Patient's full name is too short (minimum 3 characters)." }),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter a valid date of birth (YYYY-MM-DD)." }),
  gender: z.enum(['Male', 'Female'], { message: "Please select Male or Female." }),
  mrn: z.string().min(4, { message: "Medical Record Number (MRN) is too short (minimum 4 characters)." }),
  age: z.coerce.number().int({ message: "Age must be an integer number." }).positive({ message: "Age must be a positive number." }).max(130, { message: "Age is invalid." }),
  address: z.string().min(3, { message: "Address is too short (minimum 3 characters)." }),
  phone: z.string().regex(/^\+251[0-9]{9}$/, { 
    message: "Please enter a valid phone number in international format, starting with +251 followed by 9 digits (e.g., +251911234567)." 
  }),
});

export const userInviteSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(['all roles', 'director', 'admin', 'user', 'mid-manager', 'other'], { message: "Please select a valid role." }),
  customRole: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  password: z.string()
    .min(8, { message: "Initial password must be at least 8 characters long." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character." })
    .optional()
    .or(z.literal(''))
}).refine(data => data.role !== 'other' || (data.role === 'other' && data.customRole && data.customRole.trim().length > 0), {
  message: "Custom role is required when 'Other' is selected.",
  path: ['customRole']
});

export const userUpdateSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal('')),
  role: z.enum(['all roles', 'director', 'admin', 'user', 'mid-manager', 'other'], { message: "Please select a valid role." }),
  customRole: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character." })
    .optional()
    .or(z.literal(''))
}).refine(data => data.role !== 'other' || (data.role === 'other' && data.customRole && data.customRole.trim().length > 0), {
  message: "Custom role is required when 'Other' is selected.",
  path: ['customRole']
});
