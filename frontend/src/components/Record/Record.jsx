import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Radio,
  Select,
  Space,
  Typography
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import "../../assets/css/UserMedicalProfile.css";
import Prescription from "./Prescription";

const { Title } = Typography;

// Hàm xác định trạng thái và màu sắc tương ứng
const getStatusInfo = (status) => {
  switch (status) {
    case 'pending_clinical':
      return {
        label: 'Chờ xét nghiệm',
        bgColor: 'from-orange-400 to-orange-500',
        borderColor: 'border-orange-300',
        hoverBorderColor: 'hover:border-orange-400',
        textColor: 'text-orange-800',
        badgeColor: 'bg-orange-100 text-orange-800'
      };
    case 'pending_re-examination':
      return {
        label: 'Chờ tái khám',
        bgColor: 'from-purple-400 to-purple-500',
        borderColor: 'border-purple-300',
        hoverBorderColor: 'hover:border-purple-400',
        textColor: 'text-purple-800',
        badgeColor: 'bg-purple-100 text-purple-800'
      };
    case 'done':
      return {
        label: 'Hoàn thành',
        bgColor: 'from-green-400 to-green-500',
        borderColor: 'border-green-300',
        hoverBorderColor: 'hover:border-green-400',
        textColor: 'text-green-800',
        badgeColor: 'bg-green-100 text-green-800'
      };
    default:
      return {
        label: 'Chưa xác định',
        bgColor: 'from-gray-400 to-gray-500',
        borderColor: 'border-gray-300',
        hoverBorderColor: 'hover:border-gray-400',
        textColor: 'text-gray-800',
        badgeColor: 'bg-gray-100 text-gray-800'
      };
  }
};

const Record = ({ selectedAppointment, onSaveRecord, onUpdateRecord, handleRestTree, isHiddenSaveButton }) => {
  const [medicalForm] = Form.useForm();
  const [listRecord, setListRecord] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [services, setServices] = useState([]);
  const [docterActs, setDocterActs] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [prescriptionVisible, setPrescriptionVisible] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [prescription, setPrescription] = useState([]);
  const [editingMedicineIndex, setEditingMedicineIndex] = useState(null);

  // Hàm kiểm tra quyền chỉnh sửa dựa trên trạng thái
  const getFormPermissions = (status) => {
    switch (status) {
      case 'done':
        return {
          isDisabled: true,
          showLabTest: false,
          editableFields: [],
          isPrescription: false
        };
      case 'pending_re-examination':
        return {
          isDisabled: true,
          showLabTest: true,
          editableFields: ['admissionReason', 'admissionDiagnosis'],
          isPrescription: true
        };
      case 'pending_clinical':
        return {
          isDisabled: true,
          showLabTest: false,
          editableFields: [],
          isPrescription: true
        };
      default:
        return {
          isDisabled: false,
          showLabTest: false,
          editableFields: ['all'],
          isPrescription: true
        };
    }
  };

  // Kiểm tra xem field có được phép chỉnh sửa không
  const isFieldEditable = (fieldName) => {
    if (!selectedRecord) return true;
    
    const permissions = getFormPermissions(selectedRecord.status);
    if (permissions.editableFields.includes('all')) return true;
    return permissions.editableFields.includes(fieldName);
  };

  useEffect(() => {
    fetchService();
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

  const fetchDocterActs = async (services) => {
    try {
      const params = new URLSearchParams();
      if (services && services.length > 0) {
        services.forEach(service => {
          params.append('services', service);
        });
      }
      const res = await axios.get(`/api/doctor/doctor?${params.toString()}`);
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
        bhytCode: false,
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
        admissionLabTest: "",
      });
      setSelectedRecord(null);
      setSelectedServices([]);
      setSelectedMedicines([]);
      setPrescription([]);
      setEditingMedicineIndex(null);
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
    // Thêm prescription vào values để gửi sang backend
    const formData = {
      ...values,
      prescription: prescription
    };

    if (selectedRecord) {
        if (selectedRecord.status === 'done') {
            message.error("Phiếu khám này đã hoàn thành, không thể chỉnh sửa");
            return;
        }
        if (selectedRecord.status === 'pending_clinical' && !selectedRecord.admissionLabTest) {
            message.error("Vui lòng đợi kết quả xét nghiệm");
            return;
        }
        await onUpdateRecord({...selectedRecord,...formData, _id: selectedRecord._id, status: selectedRecord.status === 'pending_re-examination' ? 'done' : selectedRecord.status});
        if (selectedRecord.status === 'pending_re-examination') {
            handleRestTree();
        }
    } else {
        await onSaveRecord(formData);
        if (values.services.length === 0) {
            handleRestTree();
        }
    }

    await fetchListRecord();
  };

  const handleSelectRecord = (record) => {
    // Set record đang được chọn
    setSelectedRecord(record);
    
    // Load thông tin từ record đã chọn vào form
    if (record) {
      const services = record.services.map((service) => service._id) || [];
      medicalForm.setFieldsValue({
        fullName: record.fullName || "",
        gender: record.gender || "",
        dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
        address: record.address || "",
        bhytCode: record.bhytCode || false,
        identityNumber: record.identityNumber || "",
        admissionDate: record.admissionDate ? dayjs(record.admissionDate) : null,
        dischargeDate: record.dischargeDate ? dayjs(record.dischargeDate) : null,
        admissionReason: record.admissionReason || "",
        admissionDiagnosis: record.admissionDiagnosis || "",
        dischargeDiagnosis: record.dischargeDiagnosis || "",
        treatmentSummary: record.treatmentSummary || "",
        ethnicity: record.ethnicity || "",
        services: services,
        docterAct: record.docterAct || "",
        admissionLabTest: record.admissionLabTest || "",
      });
      setSelectedServices(services);
      
      // Load prescription nếu có
      if (record.prescription && record.prescription.length > 0) {
        setSelectedMedicines(record.prescription);
        setPrescription(record.prescription.map(item => ({
          medicine: item.medicine,
          quantity: item.quantity,
          note: item.note || ''
        })));
      } else {
        setSelectedMedicines([]);
        setPrescription([]);
      }
      
      if (record.docterAct) {
        fetchDocterActs(services);
      }
    } else {
      setSelectedMedicines([]);
      setPrescription([]);
    }
  };

  const handleSelectService = (values) => {
    medicalForm.setFieldValue('docterAct', '');
    
    fetchDocterActs(values);
    setSelectedServices(values || []);
  };

  const handlePrescriptionConfirm = (medicines) => {
    // Kiểm tra và gộp thuốc trùng _id
    const mergedMedicines = medicines.reduce((acc, currentMedicine) => {
      const existingIndex = acc.findIndex(item => item.medicine._id === currentMedicine.medicine._id);
      
      if (existingIndex !== -1) {
        // Nếu đã tồn tại, cộng quantity
        acc[existingIndex].quantity += currentMedicine.quantity;
      } else {
        // Nếu chưa tồn tại, thêm mới với note rỗng
        acc.push({
          ...currentMedicine,
          note: ''
        });
      }
      
      return acc;
    }, [...selectedMedicines]); // Bắt đầu với danh sách thuốc hiện tại

    setSelectedMedicines(mergedMedicines);
    
    // Cập nhật prescription để gửi sang backend
    const prescriptionData = mergedMedicines.map(item => ({
      medicine: item.medicine._id,
      quantity: item.quantity,
      note: item.note || ''
    }));
    setPrescription(prescriptionData);
    
    setPrescriptionVisible(false);
  };

  const handleOpenPrescription = () => {
    setPrescriptionVisible(true);
  };

  // Hàm cập nhật thuốc (số lượng hoặc ghi chú)
  const handleUpdateMedicine = (index, field, value) => {
    const updatedMedicines = [...selectedMedicines];
    updatedMedicines[index] = {
      ...updatedMedicines[index],
      [field]: value
    };
    
    setSelectedMedicines(updatedMedicines);
    
    // Cập nhật prescription
    const prescriptionData = updatedMedicines.map(item => ({
      medicine: item.medicine._id,
      quantity: item.quantity,
      note: item.note || ''
    }));
    setPrescription(prescriptionData);
  };

  // Hàm xóa thuốc
  const handleDeleteMedicine = (index) => {
    const updatedMedicines = selectedMedicines.filter((_, i) => i !== index);
    setSelectedMedicines(updatedMedicines);
    
    // Cập nhật prescription
    const prescriptionData = updatedMedicines.map(item => ({
      medicine: item.medicine._id,
      quantity: item.quantity,
      note: item.note || ''
    }));
    setPrescription(prescriptionData);
  };

  // Hàm bắt đầu chỉnh sửa
  const handleStartEdit = (index) => {
    setEditingMedicineIndex(index);
  };

  // Hàm kết thúc chỉnh sửa
  const handleFinishEdit = () => {
    setEditingMedicineIndex(null);
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
          {listRecord?.length > 0 && !isHiddenSaveButton && <div onClick={() => resetForm()} className="flex items-center justify-center w-12 h-12 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
            <Plus className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
          </div>}   
          
          {/* Danh sách các record */}
          <div className="flex gap-3 pb-2">
            {listRecord?.map((record, index) => {
              const statusInfo = getStatusInfo(record?.status);
              const isSelected = selectedRecord?._id === record?._id;

              return (
                <div 
                  key={record?._id || index} 
                  onClick={() => handleSelectRecord(record)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border ${
                    isSelected 
                      ? 'bg-gradient-to-r from-blue-400 to-blue-500 border-blue-400 text-white' 
                      : `bg-gradient-to-r ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.hoverBorderColor}`
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    isSelected ? 'text-white' : statusInfo.textColor
                  }`}>
                    {record?.createdAt ? dayjs(record.createdAt).format('DD/MM/YYYY') : 'N/A'}
                  </div>
                  <div className={`text-xs mt-1 ${
                    isSelected ? 'text-blue-100' : 'text-gray-600'
                  }`}>
                    {record?.createdAt ? dayjs(record.createdAt).format('HH:mm') : ''}
                  </div>
                  {/* Badge trạng thái */}
                  <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                    isSelected ? 'bg-blue-200 text-blue-800' : statusInfo.badgeColor
                  }`}>
                    {statusInfo.label}
                  </div>
                </div>
              );
            })}
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
            {/* Hiển thị thông báo trạng thái */}
            {/* {selectedRecord && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-sm text-blue-800">
                  <strong>Trạng thái:</strong> {getStatusInfo(selectedRecord.status).label}
                  {selectedRecord.status === 'done' && (
                    <span className="ml-2 text-red-600">(Không thể chỉnh sửa)</span>
                  )}
                  {selectedRecord.status === 'pending_clinical' && (
                    <span className="ml-2 text-red-600">(Chờ khám - không thể chỉnh sửa)</span>
                  )}
                  {selectedRecord.status === 'pending_re-examination' && (
                    <span className="ml-2 text-orange-600">(Chỉ có thể cập nhật lý do vào viện và chẩn đoán)</span>
                  )}
                </div>
              </div>
            )} */}
            {/* I. HÀNH CHÍNH */}
            <div className="form-section">
              <div className="form-section-title">I. HÀNH CHÍNH</div>
              <div className="form-row">
                <Form.Item name="fullName" label="Họ và tên (In hoa)" className="form-field">
                  <Input 
                    placeholder="Nhập họ và tên" 
                    disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                  />
                </Form.Item>
                <Form.Item name="gender" label="Giới tính" className="form-field">
                  <Radio.Group disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}>
                    <Radio value="Male">Nam</Radio>
                    <Radio value="Female">Nữ</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="dateOfBirth" label="Ngày sinh" className="form-field full-width">
                  <DatePicker 
                    format="DD/MM/YYYY" 
                    style={{ width: '100%' }} 
                    disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                  />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="ethnicity" label="Dân tộc" className="form-field">
                  <Input 
                    placeholder="Dân tộc" 
                    disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                  />
                </Form.Item>
                <Form.Item name="bhytCode" label="Có sử dụng BHYT?" className="form-field">
                  <Radio.Group disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}>
                    <Radio value={true}>Có</Radio>
                    <Radio value={false}>Không</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="identityNumber" label="Số Căn cước/Hộ chiếu/Mã định danh cá nhân" className="form-field">
                  <Input 
                    placeholder="Số CCCD/CMND" 
                    disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                  />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="admissionDate" label="Vào viện ngày" className="form-field">
                  <DatePicker 
                    format="DD/MM/YYYY" 
                    style={{ width: '100%' }} 
                    disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                  />
                </Form.Item>
                <Form.Item name="dischargeDate" label="Ra viện ngày" className="form-field">
                  <DatePicker 
                    format="DD/MM/YYYY" 
                    style={{ width: '100%' }} 
                    disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                  />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="address" label="Địa chỉ cư trú" className="form-field full-width">
                  <Input.TextArea 
                    rows={2} 
                    placeholder="Số nhà, thôn/phố, xã/phường, huyện/quận, tỉnh/thành phố" 
                    disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                  />
                </Form.Item>
              </div>
            </div>

            {/* II. CHẨN ĐOÁN */}
            <div className="form-section">
              <div className="form-section-title">II. CHẨN ĐOÁN</div>
              <div className="form-row">
                <Form.Item name="admissionDiagnosis" label="Chẩn đoán vào viện" className="form-field full-width">
                  <Input.TextArea 
                    rows={3} 
                    placeholder="(Tên bệnh và mã ICD đính kèm)" 
                    disabled={selectedRecord && !isFieldEditable('admissionDiagnosis')}
                  />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="dischargeDiagnosis" label="Chẩn đoán ra viện" className="form-field full-width">
                  <Input.TextArea 
                    rows={3} 
                    placeholder="(Tên bệnh và mã ICD đính kèm)" 
                    disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                  />
                </Form.Item>
              </div>
            </div>

            {/* III. TÓM TẮT QUÁ TRÌNH ĐIỀU TRỊ */}
            <div className="form-section">
              <div className="form-section-title">III. TÓM TẮT QUÁ TRÌNH ĐIỀU TRỊ</div>
              <div className="form-row">
                <Form.Item name="admissionReason" label="Lý do vào viện" className="form-field full-width">
                  <Input.TextArea 
                    rows={2} 
                    placeholder="Lý do vào viện" 
                    disabled={selectedRecord && !isFieldEditable('admissionReason')}
                  />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="treatmentSummary" label="Tóm tắt quá trình bệnh lý và diễn biến lâm sàng" className="form-field full-width">
                  <Input.TextArea 
                    rows={4} 
                    placeholder="(Đặc điểm khởi phát, các triệu chứng lâm sàng, diễn biến bệnh...)" 
                    disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                  />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item name="services" label="Chỉ định dịch vụ" className="form-field full-width">
                  <Select 
                    mode="multiple"
                    allowClear  
                    options={services?.map((service) => ({ label: service.name, value: service._id }))} 
                    disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                    onChange={handleSelectService}
                  />
                </Form.Item>
              </div>
              {selectedServices.length > 0 && (
                <div className="form-row">
                  <Form.Item name="docterAct" label="Do bác sĩ xét nghiệm" className="form-field full-width">
                    <Select 
                      placeholder="Do bác sĩ xét nghiệm" 
                      options={docterActs?.map((docterAct) => ({ label: docterAct?.name, value: docterAct._id }))} 
                      disabled={selectedRecord && getFormPermissions(selectedRecord.status).isDisabled}
                    />
                  </Form.Item>
                </div>
              )}
              
              {/* Trường admissionLabTest chỉ hiển thị cho pending_re-examination */}
              {selectedRecord && getFormPermissions(selectedRecord.status).showLabTest && (
                <div className="form-row">
                  <Form.Item name="admissionLabTest" label="Xét nghiệm cận lâm sàng" className="form-field full-width">
                    <Input.TextArea 
                      rows={3} 
                      placeholder="Nhập kết quả xét nghiệm cận lâm sàng..." 
                      disabled={true}
                    />
                  </Form.Item>
                </div>
              )}
            </div>

            <div className="form-section">
              <div className="form-section-title">IV. ĐƠN THUỐC</div>
              <div className="form-row">
                <div className="form-field full-width">
                  <Button 
                    type="dashed" 
                    onClick={handleOpenPrescription}
                    style={{ width: '100%', height: '40px' }}
                    disabled={selectedRecord && !getFormPermissions(selectedRecord.status).isPrescription}
                  >
                    {selectedMedicines.length > 0 
                      ? `Đã chọn ${selectedMedicines.length} loại thuốc` 
                      : 'Chọn thuốc kê đơn'
                    }
                  </Button>
                </div>
              </div>
              
              {/* Hiển thị danh sách thuốc đã chọn */}
              {selectedMedicines.length > 0 && (
                <div className="form-row">
                  <div className="form-field full-width">
                    <div style={{ 
                      padding: '12px', 
                      border: '1px solid #d9d9d9', 
                      borderRadius: '6px',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                        Thuốc đã chọn:
                      </div>
                      {selectedMedicines.map((item, index) => (
                        <div key={index} style={{ 
                          padding: '8px 0',
                          borderBottom: index < selectedMedicines.length - 1 ? '1px solid #f0f0f0' : 'none'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                {item.medicine.name}
                              </div>
                              
                              {editingMedicineIndex === index ? (
                                // Chế độ chỉnh sửa
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Số lượng:</span>
                                    <InputNumber
                                      min={1}
                                      max={item.medicine.quantity}
                                      value={item.quantity}
                                      onChange={(value) => handleUpdateMedicine(index, 'quantity', value)}
                                      style={{ width: '80px' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span>Ghi chú:</span>
                                    <Input.TextArea
                                      value={item.note || ''}
                                      onChange={(e) => handleUpdateMedicine(index, 'note', e.target.value)}
                                      placeholder="Nhập ghi chú cho thuốc..."
                                      rows={2}
                                      style={{ fontSize: '12px' }}
                                    />
                                  </div>
                                  <Space>
                                    <Button 
                                      type="primary" 
                                      size="small"
                                      onClick={handleFinishEdit}
                                    >
                                      Lưu
                                    </Button>
                                    <Button 
                                      size="small"
                                      onClick={handleFinishEdit}
                                    >
                                      Hủy
                                    </Button>
                                  </Space>
                                </div>
                              ) : (
                                // Chế độ xem
                                <div>
                                  <div style={{ marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '500' }}>Số lượng:</span> {item.quantity}
                                  </div>
                                  {item.note && (
                                    <div style={{ marginBottom: '4px' }}>
                                      <span style={{ fontWeight: '500' }}>Ghi chú:</span> {item.note}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {editingMedicineIndex !== index && (
                              <Space>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => handleStartEdit(index)}
                                  disabled={selectedRecord && !getFormPermissions(selectedRecord.status).isPrescription}
                                >
                                  Sửa
                                </Button>
                                <Popconfirm
                                  title="Xóa thuốc này?"
                                  description="Bạn có chắc chắn muốn xóa thuốc này khỏi đơn thuốc?"
                                  onConfirm={() => handleDeleteMedicine(index)}
                                  okText="Có"
                                  cancelText="Không"
                                >
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={selectedRecord && !getFormPermissions(selectedRecord.status).isPrescription}
                                  >
                                    Xóa
                                  </Button>
                                </Popconfirm>
                              </Space>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isHiddenSaveButton && <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Button type="primary" htmlType="submit" size="large">
                  {selectedRecord ? 'Cập nhật phiếu khám' : 'Lưu phiếu khám'}
                </Button>

            </div>
}
          </Form>
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            Vui lòng chọn một bệnh nhân từ danh sách chờ để tạo phiếu khám
          </div>
        )}
      </div>

      {/* Modal Prescription */}
      <Prescription 
        visible={prescriptionVisible}
        onCancel={() => setPrescriptionVisible(false)}
        onConfirm={handlePrescriptionConfirm}
      />
    </div>
  );
};

export default Record;