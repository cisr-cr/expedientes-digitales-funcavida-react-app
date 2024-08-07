import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthenticationContext"; // Adjust the path as necessary

const ExpedientesContext = createContext();

export function useExpedientes() {
  return useContext(ExpedientesContext);
}

export function ExpedientesProvider({ children }) {
  const [expedientes, setExpedientes] = useState([]);
  const [clickedExpediente, setClickedExpediente] = useState();
  const auth = useAuth();

  async function handleGetExpedientes() {
    if (!auth.user) {
      return; // Do not fetch expedientes if user is not authenticated
    }

    try {
      const response = await fetch("http://localhost:9000/api/expedientes");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setExpedientes(data);
      console.log("Expedientes loaded:", data);
    } catch (error) {
      console.error("Error fetching expedientes:", error.message);
    }
  }

  async function handleClickExpediente(id) {
    // Find the expediente with the given id
    const tmpClickedExpediente = expedientes.find(
      (expediente) => expediente._id === id
    );

    if (tmpClickedExpediente) {
      console.log("Expediente clicked:", tmpClickedExpediente);
      setClickedExpediente(tmpClickedExpediente);
    } else {
      console.warn("Expediente not found for id:", id);

      try {
        // Fetch expediente by id from the server
        const response = await fetch(
          `http://localhost:9000/api/expediente/${id}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const expedienteData = await response.json();

        console.log("Expediente clicked:", expedienteData);
        setClickedExpediente(expedienteData);
      } catch (error) {
        console.error("Error fetching expediente:", error.message);
      }
    }
  }

  async function handleSaveExpediente() {
    console.log("Saving!!");
    if (!clickedExpediente) {
      console.error("No expediente selected to save.");
      return;
    }

    clickedExpediente.InformacionGeneral.UltimaActualizacion =
      new Date().toISOString();

    // Create a copy of the clickedExpediente object without the __id key
    const { _id, ...expedienteData } = clickedExpediente;

    console.log("expedienteData", expedienteData);

    try {
      const response = await fetch(
        `http://localhost:9000/api/expediente/${clickedExpediente._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expedienteData), // Send the modified object without the __id key
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updatedExpediente = await response.json();
      console.log("Expediente updated:", updatedExpediente);
      console.log("expedientes", expedientes);
      // Optionally, you can update the clickedExpediente state with the updated data
      setClickedExpediente(updatedExpediente);
    } catch (error) {
      console.error("Error updating expediente:", error.message);
    }
  }

  async function handleAddNota(nota) {
    if (!clickedExpediente) {
      console.error("No expediente selected to add nota.");
      return;
    }

    clickedExpediente.Notas.push({
      note: nota,
      author: auth.user.displayName || auth.user.email,
      date: new Date().toISOString().slice(0, 10),
    });
    handleSaveExpediente();
  }

  async function handleSaveFamiliares(updatedFamiliares) {
    if (!clickedExpediente) {
      console.error("No expediente selected to add familiares.");
      return;
    }

    clickedExpediente.familiares = updatedFamiliares;
    handleSaveExpediente();
  }

  useEffect(() => {
    let abortController = new AbortController();
    if (auth.user) {
      handleGetExpedientes();
    }
    return () => {
      abortController.abort();
    };
  }, [auth.user]);

  const value = {
    handleGetExpedientes,
    handleClickExpediente,
    handleSaveExpediente,
    handleAddNota,
    handleSaveFamiliares,
    expedientes,
    clickedExpediente,
  };

  return (
    <ExpedientesContext.Provider value={value}>
      {children}
    </ExpedientesContext.Provider>
  );
}

export default ExpedientesContext;
