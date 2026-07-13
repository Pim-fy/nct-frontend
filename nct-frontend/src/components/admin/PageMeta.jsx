// src/components/admin/PageMeta.jsx
import { Helmet } from 'react-helmet-async';
const PageMeta = ({ title }) => (
  <Helmet><title>{title} | Ksteam Admin</title></Helmet>
);
export default PageMeta;
