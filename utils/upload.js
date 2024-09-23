import axios from "redaxios";

export const upload = async (file) => {
  const data = new FormData();

  data.append("file", file);
  data.append("upload_preset", "fiverr");

  try {
    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/dndcersc4/upload",
      data,
      { withCredentials: false }
    );
    return res.data.url;
  } catch (err) {
    console.log(err);
  }
};
