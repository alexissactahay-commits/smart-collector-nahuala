import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminRouteCommunities.css";

const AdminRouteCommunities = () => {
  // ================================
  // NORMALIZAR API_URL
  // ================================
  let API_URL = process.env.REACT_APP_API_URL || "";
  API_URL = API_URL.replace(/\/+$/, "");
  if (!API_URL.endsWith("/api")) API_URL = `${API_URL}/api`;
  // ================================

  const token = localStorage.getItem("token");

  const [routes, setRoutes] = useState([]);
  const [communities, setCommunities] = useState([]);

  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [assigned, setAssigned] = useState([]); // RouteCommunity rows

  const [newCommunityName, setNewCommunityName] = useState("");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });

  const authHeaders = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  const showAlert = (message, type = "info") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 3500);
  };

  // ----------------------------
  // Cargar rutas + comunidades
  // ----------------------------
  useEffect(() => {
    const init = async () => {
      try {
        if (!token) {
          showAlert("Tu sesión expiró. Inicia sesión nuevamente.", "error");
          window.location.href = "/login";
          return;
        }

        setLoading(true);

        const [routesRes, commRes] = await Promise.all([
          axios.get(`${API_URL}/admin/routes/`, authHeaders),
          axios.get(`${API_URL}/admin/communities/`, authHeaders),
        ]);

        setRoutes(Array.isArray(routesRes.data) ? routesRes.data : []);
        setCommunities(Array.isArray(commRes.data) ? commRes.data : []);
      } catch (err) {
        console.error(err);
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
          localStorage.removeItem("username");
          showAlert("Sesión expirada o sin permisos. Inicia sesión de nuevo.", "error");
          window.location.href = "/login";
          return;
        }
        showAlert("No se pudo cargar datos. Verifica el servidor.", "error");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [API_URL, authHeaders, token]);

  // ----------------------------
  // Cargar asignadas por ruta
  // ----------------------------
  const fetchAssigned = async (routeId) => {
    if (!routeId) {
      setAssigned([]);
      return;
    }
    try {
      const res = await axios.get(
        `${API_URL}/admin/route-communities/?route_id=${routeId}`,
        authHeaders
      );
      setAssigned(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      showAlert("No se pudo cargar comunidades asignadas.", "error");
    }
  };

  useEffect(() => {
    fetchAssigned(selectedRouteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteId]);

  // ----------------------------
  // Crear comunidad
  // ----------------------------
  const createCommunity = async () => {
    const name = String(newCommunityName || "").trim();
    if (!name) {
      showAlert("Escribe el nombre de la comunidad.", "error");
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/admin/communities/`,
        { name },
        authHeaders
      );
      setCommunities((prev) => [res.data, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCommunityName("");
      showAlert("Comunidad creada.", "success");
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.error || "No se pudo crear la comunidad.", "error");
    }
  };

  // ----------------------------
  // Editar comunidad (prompt simple)
  // ----------------------------
  const editCommunity = async (community) => {
    const current = community?.name || "";
    const name = window.prompt("Nuevo nombre de la comunidad:", current);
    if (name === null) return; // cancel
    const trimmed = String(name).trim();
    if (!trimmed) {
      showAlert("El nombre no puede ir vacío.", "error");
      return;
    }

    try {
      const res = await axios.put(
        `${API_URL}/admin/communities/${community.id}/`,
        { name: trimmed },
        authHeaders
      );

      setCommunities((prev) =>
        prev
          .map((c) => (c.id === community.id ? res.data : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      // si la comunidad estaba asignada, se verá actualizada al recargar
      await fetchAssigned(selectedRouteId);

      showAlert("Comunidad actualizada.", "success");
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.error || "No se pudo actualizar.", "error");
    }
  };

  // ----------------------------
  // Eliminar comunidad
  // ----------------------------
  const deleteCommunity = async (community) => {
    const ok = window.confirm(
      `¿Eliminar la comunidad "${community.name}"?\n\nEsto también quitará sus asignaciones a rutas.`
    );
    if (!ok) return;

    try {
      await axios.delete(`${API_URL}/admin/communities/${community.id}/`, authHeaders);
      setCommunities((prev) => prev.filter((c) => c.id !== community.id));
      await fetchAssigned(selectedRouteId);
      showAlert("Comunidad eliminada.", "success");
    } catch (err) {
      console.error(err);
      showAlert("No se pudo eliminar la comunidad.", "error");
    }
  };

  // ----------------------------
  // Asignar comunidad a ruta
  // ----------------------------
  const assignCommunity = async (communityId) => {
    if (!selectedRouteId) {
      showAlert("Selecciona una ruta primero.", "error");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/route-communities/`,
        { route_id: selectedRouteId, community_id: communityId },
        authHeaders
      );
      await fetchAssigned(selectedRouteId);
      showAlert("Comunidad asignada a la ruta.", "success");
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.error || "No se pudo asignar.", "error");
    }
  };

  // ----------------------------
  // Quitar comunidad de ruta (borra RouteCommunity)
  // ----------------------------
  const unassign = async (routeCommunityId) => {
    const ok = window.confirm("¿Quitar esta comunidad de la ruta?");
    if (!ok) return;

    try {
      await axios.delete(
        `${API_URL}/admin/route-communities/${routeCommunityId}/`,
        authHeaders
      );
      await fetchAssigned(selectedRouteId);
      showAlert("Comunidad quitada de la ruta.", "success");
    } catch (err) {
      console.error(err);
      showAlert("No se pudo quitar la comunidad.", "error");
    }
  };

  const assignedCommunityIds = useMemo(
    () => new Set((assigned || []).map((x) => x?.community?.id)),
    [assigned]
  );

  if (loading) {
    return <div className="arc-container">Cargando...</div>;
  }

  return (
    <div className="arc-container">
      <h2>Admin — Lista de Comunidades por Ruta</h2>

      {alert.message && (
        <div className={`arc-alert ${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Selector de Ruta */}
      <div className="arc-card">
        <h3>1) Selecciona una Ruta</h3>
        <select
          className="arc-select"
          value={selectedRouteId}
          onChange={(e) => setSelectedRouteId(e.target.value)}
        >
          <option value="">— Selecciona una ruta —</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Comunidades asignadas */}
      <div className="arc-card">
        <h3>2) Comunidades asignadas a la ruta</h3>

        {!selectedRouteId ? (
          <p className="arc-muted">Selecciona una ruta para ver sus comunidades.</p>
        ) : assigned.length === 0 ? (
          <p className="arc-muted">No hay comunidades asignadas aún.</p>
        ) : (
          <ul className="arc-list">
            {assigned.map((rc) => (
              <li key={rc.id} className="arc-list-item">
                <span>{rc.community?.name || "Comunidad"}</span>
                <button className="arc-btn danger" onClick={() => unassign(rc.id)}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Crear comunidad */}
      <div className="arc-card">
        <h3>3) Crear comunidad</h3>
        <div className="arc-row">
          <input
            className="arc-input"
            value={newCommunityName}
            onChange={(e) => setNewCommunityName(e.target.value)}
            placeholder="Ej: Xejuyup, Panaj, Xecaracoj..."
          />
          <button className="arc-btn" onClick={createCommunity}>
            Agregar
          </button>
        </div>
        <p className="arc-muted">
          Crea comunidades en el catálogo y luego asígnalas a la ruta seleccionada.
        </p>
      </div>

      {/* Catálogo de comunidades */}
      <div className="arc-card">
        <h3>4) Catálogo de comunidades</h3>

        {communities.length === 0 ? (
          <p className="arc-muted">No hay comunidades creadas aún.</p>
        ) : (
          <ul className="arc-list">
            {communities.map((c) => {
              const alreadyAssigned = assignedCommunityIds.has(c.id);
              return (
                <li key={c.id} className="arc-list-item">
                  <span>{c.name}</span>

                  <div className="arc-actions">
                    <button className="arc-btn secondary" onClick={() => editCommunity(c)}>
                      Editar
                    </button>
                    <button className="arc-btn danger" onClick={() => deleteCommunity(c)}>
                      Eliminar
                    </button>

                    <button
                      className="arc-btn"
                      disabled={!selectedRouteId || alreadyAssigned}
                      onClick={() => assignCommunity(c.id)}
                      title={
                        !selectedRouteId
                          ? "Selecciona una ruta"
                          : alreadyAssigned
                          ? "Ya asignada"
                          : "Asignar a ruta"
                      }
                    >
                      {alreadyAssigned ? "Asignada" : "Asignar"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminRouteCommunities;