const addUser = `INSERT INTO public.users(
	id, username, email, hashpass, password, role, is_public,created_at,updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9);`;
const addprofile = `INSERT INTO public.profile(
	id, user_id_fk, name, bio, phone, photo_url, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;

const getUserFromUserid = `SELECT id, username, email, hashpass, password, role, is_public, created_at, updated_at
FROM public.users WHERE id = $1`;

const getUserFromUsername = `SELECT id, username, email, hashpass, password, role, is_public, created_at, updated_at
FROM public.users WHERE username = $1`;
const editUser = `UPDATE public.users
SET  is_public=$2,email = $3 ,updated_at=$4
WHERE id = $1`;
const edit_profile = `UPDATE public.profile
SET   name=$2, bio=$3, phone=$4, photo_url=$5, updated_at=$6
WHERE user_id_fk = $1`;

const updatepassword = `UPDATE public.users
SET  hashpass=$2, password=$3, updated_at=$4
WHERE id = $1`;
const getuserdetails = `SELECT u.id AS user_id,u.username ,u.email,u.role,u.is_public,
p.name,p.bio,p.phone,p.photo_url,p.created_at,p.updated_at
FROM 
 public.users u
 LEFT JOIN 
 	public.profile p ON u.id =p.user_id_fk
WHERE u.id = $1 `;

module.exports = {
  addUser,
  addprofile,
  getUserFromUserid,
  getUserFromUsername,
  editUser,
  edit_profile,
  updatepassword,
  getuserdetails,
};
