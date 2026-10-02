import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
export const hashPassword = (p: string) => bcrypt.hash(p, 10)
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h)
export const createToken = (userId: string) => new SignJWT({ userId }).setProtectedHeader({alg:'HS256'}).setExpirationTime('7d').sign(secret)
export const getUserIdFromToken = async (token: string) => { const { payload } = await jwtVerify(token, secret); return payload.userId as string }