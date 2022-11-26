import axios from 'axios';
import { showAlert } from './alerts';

export default async function (tourId) {
  try {
    const res = await axios.get(`/api/v1/bookings/checkout-session/${tourId}`);
    if (res.data.status === 'success') {
      window.location.replace(res.data.transaction.data.authorization_url);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}
