/**
 * DonaNanaAvatar.jsx - Componente Visual de Avatar da Patrona
 *
 * Papel Didático:
 * Padroniza a exibição da imagem da Professora Sebastiana (Dona Nana) em toda
 * a aplicação, tratando com resiliência:
 * 1. Uso de imagem customizada ou oficial (`/img/escola-professora.jpeg`);
 * 2. Placeholder amigável caso a imagem ainda não exista ou falhe no carregamento;
 * 3. Indicador de presença e animação de status online.
 */

import { useState } from 'react';
import './donaNanaAvatar.css';

const DEFAULT_AVATAR = '/img/escola-professora.jpeg';

const DonaNanaAvatar = ({
  src,
  size = 'md',
  showBadge = false,
  alt = 'Professora Sebastiana (Dona Nana)',
  className = '',
}) => {
  const [loadFailed, setLoadFailed] = useState(false);

  const imageSource = src && src.trim() !== '' ? src : DEFAULT_AVATAR;

  const sizeClass = `dona-nana-avatar-${size}`;

  return (
    <div className={`dona-nana-avatar-wrapper ${sizeClass} ${className}`}>
      {!loadFailed ? (
        <img
          src={imageSource}
          alt={alt}
          className={`dona-nana-avatar-img ${sizeClass}`}
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <div
          className={`dona-nana-avatar-placeholder ${sizeClass}`}
          title={alt}
          role="img"
          aria-label={alt}
        >
          <i className="bi bi-mortarboard-fill fs-5"></i>
        </div>
      )}

      {showBadge && (
        <span
          className="dona-nana-status-dot"
          title="Dona Nana está online para te ajudar"
          aria-label="Online"
        />
      )}
    </div>
  );
};

export default DonaNanaAvatar;
