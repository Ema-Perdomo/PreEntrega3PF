import dotenv from 'dotenv';

dotenv.config()


const env_var = {
    mongo_url : process.env.MONGO_DB_URL ,
    session_secret : process.env.SESSION_SECRET,
    cookie_Secret : process.env.COOKIES_SECRET ,
    jwt_secret : process.env.JWT_SECRET,
    salt : process.env.SALT
}
export default env_var; //enviroment variable