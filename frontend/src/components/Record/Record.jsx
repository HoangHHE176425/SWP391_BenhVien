import {
    Button,
    DatePicker,
    Form,
    Input,
    Radio,
    Select,
    Typography
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import "../../assets/css/UserMedicalProfile.css";

const { Title } = Typography;

const Record = ({ selectedAppointment, onSaveRecord, onUpdateRecord }) => {
  const [medicalForm] = Form.useForm();
  const [listRecord, setListRecord] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [services, setServices] = useState([]);
  const [docterActs, setDocterActs] = useState([]);

  useEffect(() => {
    fetchService();
    fetchDocterActs();
  }, []);

  // Tự động điền thông tin khi có appointment được chọn
  useEffect(() => {
    if (selectedAppointment && selectedAppointment.profileId) {
        resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppointment, medicalForm]);

  useEffect(() => {
    if (!selectedAppointment) return;
    fetchListRecord();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppointment]);

  const fetchService = async () => {
    try {
      const res = await axios.get(`/api/services`);
      console.log("🚀 ~ fetchService ~ res:", res.data)
      setServices(res.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách dịch vụ:", error);
      setServices([]);
    }
  };

  const fetchDocterActs = async () => {
    try {
      const res = await axios.get(`/api/doctor/doctor`);
      console.log("🚀 ~ fetchDocterActs ~ res:", res)
      setDocterActs(res.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách docterActs:", error);
  }}

  const resetForm = () => {
    medicalForm.setFieldsValue({
        fullName: selectedAppointment.profileId.name || "",
        gender: selectedAppointment.profileId.gender || "",
        dateOfBirth: selectedAppointment.profileId.dateOfBirth ? dayjs(selectedAppointment.profileId.dateOfBirth) : null,
        address: selectedAppointment.profileId.address || "",
        bhytCode: selectedAppointment.bhytCode || "",
        identityNumber: selectedAppointment.profileId.identityNumber || "",
        admissionDate: null,
        dischargeDate: null,
        admissionReason: selectedAppointment.symptoms || "",
        admissionDiagnosis: "",
        dischargeDiagnosis: "",
        treatmentSummary: "",
        ethnicity: selectedAppointment.profileId.ethnicity || "",
        services: [],
        docterAct: "",
      });
      setSelectedRecord(null);
  };

  const fetchListRecord = async () => {
    try {
      const res = await axios.get(`/api/record`, {
        params: {
          appointmentId: selectedAppointment._id,
        },
      });
      setListRecord(res.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách record:", error);
      setListRecord([]);
    }
  };

  // Xử lý lưu phiếu khám
  const handleSaveMedicalRecord = async (values) => {
    if (selectedRecord) {
        await onUpdateRecord({...values, _id: selectedRecord._id});
    } else {
        await onSaveRecord(values);
    }

    await fetchListRecord();
  };

  const handleSelectRecord = (record) => {
    // Set record đang được chọn
    setSelectedRecord(record);
    
    // Load thông tin từ record đã chọn vào form
    if (record) {
      medicalForm.setFieldsValue({
        fullName: record.fullName || "",
        gender: record.gender || "",
        dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
        address: record.address || "",
        bhytCode: record.bhytCode || "",
        identityNumber: record.identityNumber || "",
        admissionDate: record.admissionDate ? dayjs(record.admissionDate) : null,
        dischargeDate: record.dischargeDate ? dayjs(record.dischargeDate) : null,
        admissionReason: record.admissionReason || "",
        admissionDiagnosis: record.admissionDiagnosis || "",
        dischargeDiagnosis: record.dischargeDiagnosis || "",
        treatmentSummary: record.treatmentSummary || "",
        ethnicity: record.ethnicity || "",
        services: record.services.map((service) => service._id) || [],
        docterAct: record.docterAct || "",
      });
    }
  };

  return (
    <div className="khung-ho-so w-2/3">
      <div className="khung-cac-tab-records-phieu-kham">
        <Title level={4}>Phiếu khám bệnh</Title>
      </div>
      
      {/* Tab Navigation cho các record */}
      {selectedAppointment && (<div className="mb-6">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-2 overflow-x-auto">
          {/* Nút thêm record mới */}
          {listRecord?.length > 0 && <div onClick={() => resetForm()} className="flex items-center justify-center w-12 h-12 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
            <Plus className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
          </div>}   
          
          {/* Danh sách các record */}
          <div className="flex gap-3 pb-2">
            {listRecord?.map((record, index) => (
              <div 
                key={record?._id || index} 
                onClick={() => handleSelectRecord(record)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border ${
                  selectedRecord?._id === record?._id 
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500 border-blue-400 text-white' 
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500 border-yellow-300 hover:border-yellow-400'
                }`}
              >
                <div className={`text-sm font-medium ${
                  selectedRecord?._id === record?._id ? 'text-white' : 'text-gray-800'
                }`}>
                  {record?.createdAt ? dayjs(record.createdAt).format('DD/MM/YYYY') : 'N/A'}
                </div>
                <div className={`text-xs mt-1 ${
                  selectedRecord?._id === record?._id ? 'text-blue-100' : 'text-gray-600'
                }`}>
                  {record?.createdAt ? dayjs(record.createdAt).format('HH:mm') : ''}
                </div>
              </div>
            ))}
          </div>
          
          {/* Thông báo nếu không có record */}
          {(!listRecord || listRecord.length === 0) && (
            <div className="text-gray-500 text-sm italic">
              Chưa có phiếu khám nào
            </div>
          )}
        </div>
      </div>)}
      <div className="khung-tab-phieu-kham-moi-nhat">
        {selectedAppointment ? (
          <Form
            form={medicalForm}
            layout="vertical"
            onFinish={handleSaveMedicalRecord}
            className="medical-form max-h-[500px] overflow-y-auto"
          >
            {/* I. HÀNH CHÍNH */}
            <div className="form-section">
              <div className="form-section-title">I. HÀNH CHÍNH</div>
              <div className="form-row">
                <Form.Item name="fullName" label="Họ và tên (In hoa)" className="form-field">
                  <Input placeholder="Nhập họ và tên" />
                </Form.Item>
                <Form.Item name="gender" label="Giới tính" className="form-field">
                  <Radio.Group>
                    <Radio value="Male">Nam</Radio>
                    <Radio value="Female">Nữ</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="dateOfBirth" label="Ngày sinh" className="form-field full-width">
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
                {/* <Form.Item name="age" label="Tuổi" className="form-field">
                  <Input placeholder="Tuổi" />
                </Form.Item> */}
              </div>
              <div className="form-row">
                <Form.Item name="ethnicity" label="Dân tộc" className="form-field">
                  <Input placeholder="Dân tộc" />
                </Form.Item>
                <Form.Item name="bhytCode" label="Số thẻ BHYT" className="form-field">
                  <Input placeholder="Số thẻ BHYT" />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="identityNumber" label="Số Căn cước/Hộ chiếu/Mã định danh cá nhân" className="form-field">
                  <Input placeholder="Số CCCD/CMND" />
                </Form.Item>
              </div>
              <div className="form-row">
              <Form.Item name="admissionDate" label="Vào viện ngày" className="form-field">
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="dischargeDate" label="Ra viện ngày" className="form-field">
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="address" label="Địa chỉ cư trú" className="form-field full-width">
                  <Input.TextArea rows={2} placeholder="Số nhà, thôn/phố, xã/phường, huyện/quận, tỉnh/thành phố" />
                </Form.Item>
              </div>
            </div>

            {/* II. CHẨN ĐOÁN */}
            <div className="form-section">
              <div className="form-section-title">II. CHẨN ĐOÁN</div>
              <div className="form-row">
                <Form.Item name="admissionDiagnosis" label="Chẩn đoán vào viện" className="form-field full-width">
                  <Input.TextArea rows={3} placeholder="(Tên bệnh và mã ICD đính kèm)" />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="dischargeDiagnosis" label="Chẩn đoán ra viện" className="form-field full-width">
                  <Input.TextArea rows={3} placeholder="(Tên bệnh và mã ICD đính kèm)" />
                </Form.Item>
              </div>
            </div>

            {/* III. TÓM TẮT QUÁ TRÌNH ĐIỀU TRỊ */}
            <div className="form-section">
              <div className="form-section-title">III. TÓM TẮT QUÁ TRÌNH ĐIỀU TRỊ</div>
              <div className="form-row">
                <Form.Item name="admissionReason" label="Lý do vào viện" className="form-field full-width">
                  <Input.TextArea rows={2} placeholder="Lý do vào viện" />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="treatmentSummary" label="Tóm tắt quá trình bệnh lý và diễn biến lâm sàng" className="form-field full-width">
                  <Input.TextArea 
                    rows={4} 
                    placeholder="(Đặc điểm khởi phát, các triệu chứng lâm sàng, diễn biến bệnh...)" 
                  />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="services" label="Chỉ định dịch vụ" className="form-field full-width">
                  <Select mode="multiple"
      allowClear  options={services?.map((service) => ({ label: service.name, value: service._id }))} />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="docterAct" label="Do bác sĩ thực hiện" className="form-field full-width">
                  <Select placeholder="Do bác sĩ thực hiện" options={docterActs?.map((docterAct) => ({ label: docterAct?.name, value: docterAct._id }))} />
                </Form.Item>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Button type="primary" htmlType="submit" size="large">
                Lưu phiếu khám
              </Button>
            </div>
          </Form>
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            Vui lòng chọn một bệnh nhân từ danh sách chờ để tạo phiếu khám
          </div>
        )}
      </div>
    </div>
  );
};

export default Record;