import bcrypt from 'bcrypt';
import env_var from '../dotenv.js';

//bcrypt.hashSync(password, salt): encripta la contraseña
//bcrypt.compareSync(password, hash): compara la contraseña encriptada con la contraseña ingresada
//genSaltSync(num): num es el costo de la encriptación 
export const createHash =  (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(env_var.salt));
export const validatePassword =  (passwordSend, passwordBdd) => bcrypt.compareSync(passwordSend, passwordBdd);