// Add patient screen.
import { useNavigate } from 'react-router-dom';
import PatientForm from '../components/PatientForm';
import { createPatient } from '../services/patientService';

const AddPatient = () => {
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    await createPatient(payload);
    navigate('/');
  };

  return (
    <div className="container">
      <PatientForm onSubmit={handleSubmit} submitLabel="Create Patient" />
    </div>
  );
};

export default AddPatient;