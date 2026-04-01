'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { createSession, deleteSession } from '@/lib/session';
import { SignupFormSchema, LoginFormSchema, FormState } from '@/lib/definitions';
import { logActivity } from '@/lib/activity';

export async function signup(state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  await dbConnect();

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return {
      message: 'An account with this email already exists.',
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  await logActivity('New user signed up', 'Auth', user._id.toString());
  await createSession(user._id.toString(), user.name, user.email, user.role);
  redirect('/dashboard');
}

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    return {
      message: 'Invalid email or password.',
    };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return {
      message: 'Invalid email or password.',
    };
  }

  await logActivity('User logged in', 'Auth', user._id.toString());
  await createSession(user._id.toString(), user.name, user.email, user.role);
  redirect('/dashboard');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
