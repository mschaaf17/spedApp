import React, { useState } from "react";
import { M3Button } from "../components/M3Components";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Modal } from "antd";
import { useMutation, useQuery } from "@apollo/client";
import { REMOVE_STUDENT_FROM_LIST } from "../utils/mutations";
import { QUERY_ME } from "../utils/queries";

const DeleteStudent = ({ students = [], onSelectStudent }) => {
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [removeStudentFromList] = useMutation(REMOVE_STUDENT_FROM_LIST);
  const { refetch } = useQuery(QUERY_ME);

  // Helper: get selected student names
  const selectedNames = students
    .filter((s) => selectedForDelete.includes(s._id))
    .map((s) => `${s.firstName} ${s.lastName}`);

  // Toggle selection for delete
  const handleStudentDeleteToggle = (id) => {
    setSelectedForDelete((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Remove button click
  const handleRemove = () => setConfirmModalOpen(true);

  // Confirm delete
  const handleConfirmDelete = async () => {
    for (const id of selectedForDelete) {
      try {
        await removeStudentFromList({ variables: { studentId: id } });
      } catch (error) {
        console.error("Error removing student:", error);
      }
    }
    await refetch();
    setSelectedForDelete([]);
    setDeleteMode(false);
    setConfirmModalOpen(false);
  };

  // Cancel delete
  const handleCancelDelete = () => setConfirmModalOpen(false);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <span style={{ flex: 1 }} />
        <DeleteForeverIcon
          style={{
            fontSize: 32,
            color: deleteMode ? "#b71c1c" : "var(--md-on-surface)",
            cursor: "pointer",
            marginLeft: 16,
            transition: "color 0.2s"
          }}
          titleAccess={deleteMode ? "Cancel Remove" : "Remove Students"}
          onClick={() => {
            setDeleteMode((d) => !d);
            setSelectedForDelete([]);
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {students.map((student) => {
          const isSelected = selectedForDelete.includes(student._id);
          return (
            <M3Button
              key={student._id}
              variant="filled"
              style={{
                background: deleteMode
                  ? isSelected
                    ? "#ffcccc"
                    : "#ffeaea"
                  : "var(--md-primary-95)",
                color: deleteMode
                  ? isSelected
                    ? "#b71c1c"
                    : "#b71c1c"
                  : "var(--md-primary-40)",
                fontWeight: 600,
                fontSize: "18px",
                borderRadius: 24,
                border: isSelected ? "2px solid #b71c1c" : undefined,
                opacity: deleteMode && !isSelected ? 0.7 : 1,
                cursor: "pointer"
              }}
              fullWidth
              onClick={() =>
                deleteMode
                  ? handleStudentDeleteToggle(student._id)
                  : onSelectStudent?.(student)
              }
            >
              {student.firstName} {student.lastName}
            </M3Button>
          );
        })}
      </div>
      {/* Remove Button */}
      {deleteMode && selectedForDelete.length > 0 && (
        <M3Button
          variant="filled"
          style={{
            background: "#b71c1c",
            color: "#fff",
            fontWeight: 700,
            marginTop: 32,
            borderRadius: 24
          }}
          fullWidth
          onClick={handleRemove}
        >
          Remove {selectedForDelete.length > 1 ? "Students" : "Student"}
        </M3Button>
      )}
      {/* Confirmation Modal */}
      <Modal
        open={confirmModalOpen}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Yes, Remove"
        okType="danger"
        cancelText="Cancel"
      >
        Are you sure you want to remove{" "}
        {selectedNames.length === 1
          ? selectedNames[0]
          : selectedNames.slice(0, -1).join(", ") +
            " and " +
            selectedNames[selectedNames.length - 1]}
        ?
      </Modal>
    </div>
  );
};

export default DeleteStudent;