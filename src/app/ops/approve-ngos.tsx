import { Redirect } from 'expo-router';

/** Moved to the authority area; kept so old links still work. */
export default function ApproveNgosRedirect() {
  return <Redirect href="/authority/ngos" />;
}
