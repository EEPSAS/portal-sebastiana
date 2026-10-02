import React from "react";

const Header = ({
  userName = "Maria Silva",
  role = "Padrão",
  userPhoto
}) => {
  return (
    <header className="dashboard-header bg-white shadow-sm d-flex align-items-center justify-content-between px-4 py-2 mb-3">
      <div className="d-flex align-items-center">
        <span className="fs-5 fw-bold text-dark">Painel de Controle</span>
      </div>

      <div className="d-flex align-items-center ms-auto gap-3">
        <div className="text-end">
          <span className="fw-bold d-block text-dark lh-sm">{userName}</span>
          <small className="text-muted d-block text-capitalize">{role}</small>
        </div>
        <div className="user-avatar-container">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={userName}
              className="rounded-circle border border-2 border-primary"
              style={{ width: "42px", height: "42px", objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold border border-2 border-primary-subtle"
              style={{ width: "42px", height: "42px", fontSize: "1.2rem" }}
            >
              <i className="bi bi-person-fill"></i>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
