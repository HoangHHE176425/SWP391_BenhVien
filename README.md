# SWP391_BenhVien

The Hospital Management System streamlines patient records, appointment scheduling, billing, and staff management, minimizing paperwork and improving operational efficiency. The system offers a user-friendly interface that is easy to use for both medical staff and patients.

## Tech

Frontend: ReactJS, Vite <br>
Backend: NodeJS/Express

**Steps to run** <br>
b1: cd backend <br>
b2: npm i <br>
b3: npm start

**Tracking, UC list**

https://docs.google.com/spreadsheets/d/1AE6vILGzh7uZhBts1LL_CATSo6Ex995hsec6bwHekHA/edit?usp=sharing

**Note(Nháp)**

https://docs.google.com/document/d/1AJ3D2scdQhiDwirO585AxE6SVBAJsizy3oH2Q3VF7a0/edit?usp=sharing

**Drive Doc**

https://drive.google.com/drive/folders/15sPJVVUFKpDXUQ4hnqc5aCCSgxHKO5hf?usp=sharing

## 功能说明

### 药房交易功能 (Pharmacy Transaction)

**功能描述：**
- 允许药剂师为患者或非患者创建药品购买交易
- 支持两种交易模式：
  1. **患者交易**：需要选择有效的患者ID，系统会验证患者信息
  2. **非患者交易**：选择"Không phải bệnh nhân"选项，无需验证患者信息，直接进行支付

**使用方法：**
1. 在药房管理页面点击"创建交易"
2. 选择患者类型：
   - "Chọn bệnh nhân"：为患者购买，需要选择患者ID
   - "Không phải bệnh nhân"：为非患者购买，无需验证
3. 选择药品和数量
4. 选择支付方式（现金或在线支付）
5. 确认交易

**技术实现：**
- 前端：React组件 `PharmacyTransactionModal.jsx`
- 后端：API端点 `/pharmacist/transactions`
- 数据库：`PharmacyTransaction` 模型
- 验证逻辑：根据患者类型动态调整验证规则
