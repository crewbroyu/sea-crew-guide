import RequireActivation from './RequireActivation';

export default function ProtectedRoute({ children }) {
  return <RequireActivation>{children}</RequireActivation>;
}
