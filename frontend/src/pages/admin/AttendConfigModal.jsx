import React, { useEffect, useState } from "react";
import { Modal, TimePicker, message } from "antd";
import axios from "axios";
import dayjs from "dayjs";

const AttendConfigModal = ({ open, onClose }) => {
  const [deadline, setDeadline] = useState(dayjs("08:30", "HH:mm"));

  useEffect(() => {
    if (open) {
      axios
        .get("/api/admin/attend-config")
        .then((res) => {
          const timeStr = res.data.data?.checkInDeadline;
          console.log("Check-in deadline from API:", res.data.data?.checkInDeadline);

          const parsed = dayjs(timeStr, "HH:mm", true);
          if (parsed.isValid()) {
            setDeadline(parsed);
          } else {
            message.warning("Received invalid time format. Using default.");
            setDeadline(dayjs("08:30", "HH:mm"));
          }
        })
        .catch(() => {
          message.error("Failed to load config");
          setDeadline(dayjs("08:30", "HH:mm"));
        });
    }
  }, [open]);

  const handleSave = async () => {
    try {
      await axios.put("/api/admin/upd-config", {
        deadlineTime: deadline.format("HH:mm"),
      });
      message.success("Deadline updated");
      onClose();
    } catch (err) {
      message.error("Failed to update config");
    }
  };

  return (
    <Modal
      title="Update Check-in Deadline"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
    >
      <TimePicker
        value={deadline}
        onChange={(val) => setDeadline(val)}
        format="HH:mm"
      />
    </Modal>
  );
};

export default AttendConfigModal;
