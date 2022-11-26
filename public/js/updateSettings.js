import axios from 'axios';
import { showAlert } from './alerts';

// This function is called when the user clicks the 'Update Settings' button on the 'My Account' page
// data is the data that the user has entered into the form
// type is the type of data that is being updated which is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const res = await axios({
      method: 'PATCH',

      url:
        type === 'data'
          ? '/api/v1/users/updateMe'
          : '/api/v1/users/updatePassword',
      data,
    });
    if (res.data.status === 'success') {
      if (type === 'data') {
        showAlert('success', 'Data updated successfully!');
      }
      if (type === 'password') {
        showAlert('success', 'Password updated successfully!');
      }
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
