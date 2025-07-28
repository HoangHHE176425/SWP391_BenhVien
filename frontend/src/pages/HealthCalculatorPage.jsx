import React, { useState } from 'react';
import '../assets/css/HealthCalculatorPage.css';

// --- BMI ---
const BMICalculator = () => {
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [bmi, setBmi] = useState(null);
    const [result, setResult] = useState('');
    const [advice, setAdvice] = useState('');

    const calculateBMI = () => {
        const h = parseFloat(height) / 100;
        const w = parseFloat(weight);
        if (!h || !w) return;

        const bmiValue = (w / (h * h)).toFixed(2);
        setBmi(parseFloat(bmiValue));

        let res = '';
        let adv = '';
        if (bmiValue < 18.5) {
            res = 'Thiếu cân';
            adv = 'Bạn nên ăn uống đủ chất, tăng cường dinh dưỡng.';
        } else if (bmiValue < 24.9) {
            res = 'Bình thường';
            adv = 'Cơ thể khỏe mạnh. Hãy tiếp tục duy trì chế độ hiện tại.';
        } else if (bmiValue < 29.9) {
            res = 'Thừa cân';
            adv = 'Bạn nên bắt đầu tập thể dục thường xuyên và hạn chế đồ ngọt.';
        } else if (bmiValue < 35) {
            res = 'Béo phì cấp 1';
            adv = 'Bạn nên gặp chuyên gia dinh dưỡng để được tư vấn giảm cân.';
        } else {
            res = 'Béo phì cấp 2';
            adv = 'Cần được can thiệp y tế hoặc điều trị theo dõi giảm cân.';
        }

        setResult(res);
        setAdvice(adv);
    };

    return (
        <div className="calculator">
            <h3>Tính BMI</h3>
            <input placeholder="Chiều cao (cm)" value={height} onChange={e => setHeight(e.target.value)} />
            <input placeholder="Cân nặng (kg)" value={weight} onChange={e => setWeight(e.target.value)} />
            <button onClick={calculateBMI}>Tính</button>

            {bmi && (
                <div>
                    <p>Kết quả: <strong>{bmi}</strong> – {result}</p>
                    <p><em>Lời khuyên:</em> {advice}</p>

                    <table className="bmi-table">
                        <thead>
                            <tr>
                                <th>Phân loại</th>
                                <th>Chỉ số BMI</th>
                                <th>Màu</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={bmi < 18.5 ? 'highlight' : ''}>
                                <td>Thiếu cân</td>
                                <td>{'< 18.5'}</td>
                                <td style={{ backgroundColor: '#a2d5f2' }}></td>
                            </tr>
                            <tr className={bmi >= 18.5 && bmi < 25 ? 'highlight' : ''}>
                                <td>Bình thường</td>
                                <td>18.5 – 24.9</td>
                                <td style={{ backgroundColor: '#8fd694' }}></td>
                            </tr>
                            <tr className={bmi >= 25 && bmi < 30 ? 'highlight' : ''}>
                                <td>Thừa cân</td>
                                <td>25 – 29.9</td>
                                <td style={{ backgroundColor: '#f5e960' }}></td>
                            </tr>
                            <tr className={bmi >= 30 && bmi < 35 ? 'highlight' : ''}>
                                <td>Béo phì cấp 1</td>
                                <td>30 – 34.9</td>
                                <td style={{ backgroundColor: '#ffae42' }}></td>
                            </tr>
                            <tr className={bmi >= 35 ? 'highlight' : ''}>
                                <td>Béo phì cấp 2</td>
                                <td>{'>= 35'}</td>
                                <td style={{ backgroundColor: '#f76060' }}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- BMR Activity Table (static HTML) ---
const BMRCalculator = () => (
    <div className="calculator">
        <h3>Mức độ hoạt động (BMR)</h3>
        <table className="bmi-table">
            <thead>
                <tr><th>Mức độ hoạt động</th><th>Chỉ số</th><th>Mô tả</th></tr>
            </thead>
            <tbody>
                <tr><td>Ít hoạt động</td><td>BMR x 1.2</td><td>Ngồi nhiều, không tập thể dục</td></tr>
                <tr><td>Hoạt động nhẹ</td><td>BMR x 1.375</td><td>Tập nhẹ 1–3 lần/tuần</td></tr>
                <tr><td>Vừa phải</td><td>BMR x 1.55</td><td>Tập đều 3–5 lần/tuần</td></tr>
                <tr><td>Cường độ cao</td><td>BMR x 1.725</td><td>Vận động mạnh hằng ngày</td></tr>
            </tbody>
        </table>
    </div>
);

// --- Hydration ---
const HydrationCalculator = () => {
    const [weight, setWeight] = useState('');
    const [waterNeed, setWaterNeed] = useState(null);
    const [advice, setAdvice] = useState('');

    const calculateWater = () => {
        const w = parseFloat(weight);
        if (!w) return;
        const ml = w * 35;
        const liters = ml / 1000;
        setWaterNeed(liters.toFixed(2));

        if (liters < 1.5) setAdvice('Bạn cần uống nhiều nước hơn để tránh mất nước.');
        else if (liters < 3) setAdvice('Bạn đang ở mức uống nước hợp lý.');
        else setAdvice('Bạn nên chia nhỏ thời gian uống để tránh áp lực lên thận.');
    };

    return (
        <div className="calculator">
            <h3>Lượng nước cần uống mỗi ngày</h3>
            <input placeholder="Cân nặng (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <button onClick={calculateWater}>Tính</button>
            {waterNeed && (
                <>
                    <p>Kết quả: <strong>{waterNeed} L/ngày</strong></p>
                    <p><em>Lời khuyên:</em> {advice}</p>
                    <table className="bmi-table">
                        <thead>
                            <tr><th>Phân loại</th><th>Lượng nước</th><th>Màu</th></tr>
                        </thead>
                        <tbody>
                            <tr className={waterNeed < 1.5 ? 'highlight' : ''}>
                                <td>Thiếu nước</td>
                                <td>{'< 1.5L'}</td>
                                <td style={{ backgroundColor: '#f8d7da' }}></td>
                            </tr>
                            <tr className={waterNeed >= 1.5 && waterNeed <= 3 ? 'highlight' : ''}>
                                <td>Bình thường</td>
                                <td>1.5 – 3L</td>
                                <td style={{ backgroundColor: '#d4edda' }}></td>
                            </tr>
                            <tr className={waterNeed > 3 ? 'highlight' : ''}>
                                <td>Quá nhiều</td>
                                <td>{'> 3L'}</td>
                                <td style={{ backgroundColor: '#fff3cd' }}></td>
                            </tr>
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

// --- Calorie Intake ---
const CalorieIntakeCalculator = () => {
    const [tdee, setTdee] = useState('');
    const [goal, setGoal] = useState('maintain');
    const [result, setResult] = useState(null);
    const [advice, setAdvice] = useState('');

    const calculateCalories = () => {
        const base = parseFloat(tdee);
        if (!base) return;

        let value = base;
        let adv = '';

        if (goal === 'lose') {
            value -= 500;
            adv = 'Giảm 500 cal/ngày giúp giảm ~0.5kg/tuần. Kết hợp tập luyện.';
        } else if (goal === 'gain') {
            value += 500;
            adv = 'Tăng 500 cal/ngày giúp tăng cân ổn định. Chú trọng protein.';
        } else {
            adv = 'Duy trì cân nặng ổn định. Chú ý cân bằng dinh dưỡng.';
        }

        setResult(value);
        setAdvice(adv);
    };

    return (
        <div className="calculator">
            <h3>Lượng calo theo mục tiêu</h3>
            <input placeholder="TDEE (cal/ngày)" value={tdee} onChange={(e) => setTdee(e.target.value)} />
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option value="maintain">Giữ cân</option>
                <option value="lose">Giảm cân</option>
                <option value="gain">Tăng cân</option>
            </select>
            <button onClick={calculateCalories}>Tính</button>

            {result && (
                <>
                    <p>Kết quả: <strong>{result} cal/ngày</strong></p>
                    <p><em>Lời khuyên:</em> {advice}</p>
                    <table className="bmi-table">
                        <thead><tr><th>Mục tiêu</th><th>Ước lượng calo</th><th>Gợi ý</th></tr></thead>
                        <tbody>
                            <tr className={goal === 'lose' ? 'highlight' : ''}>
                                <td>Giảm cân</td>
                                <td>TDEE - 500</td>
                                <td>Ăn ít hơn, tập thể dục</td>
                            </tr>
                            <tr className={goal === 'maintain' ? 'highlight' : ''}>
                                <td>Giữ cân</td>
                                <td>TDEE</td>
                                <td>Duy trì chế độ ăn hiện tại</td>
                            </tr>
                            <tr className={goal === 'gain' ? 'highlight' : ''}>
                                <td>Tăng cân</td>
                                <td>TDEE + 500</td>
                                <td>Ăn nhiều hơn, bổ sung protein</td>
                            </tr>
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

// --- IBW ---
const IBWCalculator = () => {
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [gender, setGender] = useState('male');
    const [ibw, setIbw] = useState(null);
    const [advice, setAdvice] = useState('');

    const calculateIBW = () => {
        const h = parseFloat(height);
        const w = parseFloat(weight);
        if (!h || h < 100) return;
        const value = gender === 'male'
            ? 50 + 0.9 * (h - 152)
            : 45.5 + 0.9 * (h - 152);
        const fixed = +value.toFixed(1);
        setIbw(fixed);

        if (!w) return;
        const diff = w - fixed;

        if (diff < -5) setAdvice('Bạn nhẹ hơn cân lý tưởng. Cần tăng dinh dưỡng.');
        else if (diff > 5) setAdvice('Bạn nặng hơn lý tưởng. Cân nhắc giảm cân.');
        else setAdvice('Bạn đang ở mức cân lý tưởng.');
    };

    return (
        <div className="calculator">
            <h3>Cân nặng lý tưởng (IBW)</h3>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
            </select>
            <input placeholder="Chiều cao (cm)" value={height} onChange={(e) => setHeight(e.target.value)} />
            <input placeholder="Cân nặng hiện tại (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <button onClick={calculateIBW}>Tính</button>

            {ibw && (
                <>
                    <p>Kết quả: <strong>{ibw} kg</strong></p>
                    <p><em>Lời khuyên:</em> {advice}</p>
                    <table className="bmi-table">
                        <thead>
                            <tr><th>Mức chênh lệch</th><th>Gợi ý</th></tr>
                        </thead>
                        <tbody>
                            <tr className={parseFloat(weight) - ibw < -5 ? 'highlight' : ''}>
                                <td>{'< -5kg'}</td>
                                <td>Thiếu cân - cần tăng cường ăn uống</td>
                            </tr>
                            <tr className={Math.abs(parseFloat(weight) - ibw) <= 5 ? 'highlight' : ''}>
                                <td>± 5kg</td>
                                <td>Đang cân đối</td>
                            </tr>
                            <tr className={parseFloat(weight) - ibw > 5 ? 'highlight' : ''}>
                                <td>{'> +5kg'}</td>
                                <td>Thừa cân - nên điều chỉnh chế độ</td>
                            </tr>
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};
const WHRCalculator = () => {
    const [waist, setWaist] = useState('');
    const [hip, setHip] = useState('');
    const [gender, setGender] = useState('male');
    const [whr, setWhr] = useState(null);
    const [risk, setRisk] = useState('');
    const [advice, setAdvice] = useState('');

    const calculateWHR = () => {
        const w = parseFloat(waist);
        const h = parseFloat(hip);
        if (!w || !h) return;

        const ratio = (w / h).toFixed(2);
        setWhr(ratio);

        let riskLevel = '';
        let adviceText = '';

        if (gender === 'male') {
            if (ratio < 0.9) {
                riskLevel = 'Bình thường';
                adviceText = 'Nguy cơ thấp, duy trì lối sống lành mạnh.';
            } else {
                riskLevel = 'Nguy cơ cao';
                adviceText = 'Cần kiểm tra sức khỏe và cải thiện chế độ ăn uống.';
            }
        } else {
            if (ratio < 0.85) {
                riskLevel = 'Bình thường';
                adviceText = 'Nguy cơ thấp, duy trì lối sống lành mạnh.';
            } else {
                riskLevel = 'Nguy cơ cao';
                adviceText = 'Cần kiểm tra sức khỏe và cải thiện chế độ ăn uống.';
            }
        }

        setRisk(riskLevel);
        setAdvice(adviceText);
    };

    return (
        <div className="calculator">
            <h3>WHR – Tỷ số eo/mông</h3>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
            </select>
            <input placeholder="Vòng eo (cm)" value={waist} onChange={(e) => setWaist(e.target.value)} />
            <input placeholder="Vòng mông (cm)" value={hip} onChange={(e) => setHip(e.target.value)} />
            <button onClick={calculateWHR}>Tính</button>

            {whr && (
                <>
                    <p>Kết quả WHR: <strong>{whr}</strong></p>
                    <p><em>Đánh giá:</em> {risk}</p>
                    <p><em>Lời khuyên:</em> {advice}</p>

                    <table className="bmi-table">
                        <thead>
                            <tr><th>Phân loại</th><th>Chỉ số WHR</th><th>Màu</th></tr>
                        </thead>
                        <tbody>
                            <tr className={risk === 'Bình thường' ? 'highlight' : ''}>
                                <td>Bình thường</td>
                                <td>{gender === 'male' ? '< 0.9' : '< 0.85'}</td>
                                <td style={{ backgroundColor: '#8fd694' }}></td>
                            </tr>
                            <tr className={risk === 'Nguy cơ cao' ? 'highlight' : ''}>
                                <td>Nguy cơ cao</td>
                                <td>{gender === 'male' ? '≥ 0.9' : '≥ 0.85'}</td>
                                <td style={{ backgroundColor: '#f76060' }}></td>
                            </tr>
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};


const WHtRCalculator = () => {
    const [waist, setWaist] = useState('');
    const [height, setHeight] = useState('');
    const [whtr, setWhtr] = useState(null);
    const [advice, setAdvice] = useState('');
    const [classification, setClassification] = useState('');

    const calculateWHtR = () => {
        const w = parseFloat(waist);
        const h = parseFloat(height);
        if (!w || !h) return;

        const ratio = (w / h).toFixed(2);
        setWhtr(ratio);

        let classif = '';
        let adv = '';

        if (ratio < 0.4) {
            classif = 'Thiếu cân';
            adv = 'Cần tăng cường dinh dưỡng để đạt tỷ lệ hợp lý.';
        } else if (ratio < 0.5) {
            classif = 'Lý tưởng';
            adv = 'Tỷ lệ eo/chiều cao hợp lý, nguy cơ sức khỏe thấp.';
        } else if (ratio < 0.6) {
            classif = 'Nguy cơ cao';
            adv = 'Nguy cơ bệnh tim mạch tăng, cần chú ý giảm eo.';
        } else {
            classif = 'Nguy cơ rất cao';
            adv = 'Cần can thiệp y tế và thay đổi lối sống ngay.';
        }

        setClassification(classif);
        setAdvice(adv);
    };

    return (
        <div className="calculator">
            <h3>WHtR – Tỷ lệ eo/chiều cao</h3>
            <input placeholder="Vòng eo (cm)" value={waist} onChange={(e) => setWaist(e.target.value)} />
            <input placeholder="Chiều cao (cm)" value={height} onChange={(e) => setHeight(e.target.value)} />
            <button onClick={calculateWHtR}>Tính</button>

            {whtr && (
                <>
                    <p>Kết quả WHtR: <strong>{whtr}</strong></p>
                    <p><em>Phân loại:</em> {classification}</p>
                    <p><em>Lời khuyên:</em> {advice}</p>

                    <table className="bmi-table">
                        <thead>
                            <tr><th>Phân loại</th><th>Giá trị WHtR</th><th>Màu</th></tr>
                        </thead>
                        <tbody>
                            <tr className={classification === 'Thiếu cân' ? 'highlight' : ''}>
                                <td>Thiếu cân</td>
                                <td>{'< 0.4'}</td>
                                <td style={{ backgroundColor: '#a2d5f2' }}></td>
                            </tr>
                            <tr className={classification === 'Lý tưởng' ? 'highlight' : ''}>
                                <td>Lý tưởng</td>
                                <td>0.4 – 0.5</td>
                                <td style={{ backgroundColor: '#8fd694' }}></td>
                            </tr>
                            <tr className={classification === 'Nguy cơ cao' ? 'highlight' : ''}>
                                <td>Nguy cơ cao</td>
                                <td>0.5 – 0.6</td>
                                <td style={{ backgroundColor: '#f5e960' }}></td>
                            </tr>
                            <tr className={classification === 'Nguy cơ rất cao' ? 'highlight' : ''}>
                                <td>Nguy cơ rất cao</td>
                                <td>{'> 0.6'}</td>
                                <td style={{ backgroundColor: '#f76060' }}></td>
                            </tr>
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};


const BodyFatCalculator = () => {
    const [bmi, setBmi] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('male');
    const [bodyFat, setBodyFat] = useState(null);
    const [classification, setClassification] = useState('');
    const [advice, setAdvice] = useState('');

    const calculateBodyFat = () => {
        const b = parseFloat(bmi);
        const a = parseFloat(age);
        const g = gender === 'male' ? 1 : 0;

        if (!b || !a) return;

        const result = (1.2 * b + 0.23 * a - 10.8 * g - 5.4).toFixed(1);
        setBodyFat(result);

        const bf = parseFloat(result);

        let classif = '';
        let adv = '';

        if (gender === 'male') {
            if (bf < 6) {
                classif = 'Quá thấp';
                adv = 'Cần tăng cân và tăng lượng mỡ cơ thể lành mạnh.';
            } else if (bf < 17) {
                classif = 'Bình thường';
                adv = 'Mức mỡ cơ thể hợp lý, duy trì lối sống hiện tại.';
            } else if (bf < 25) {
                classif = 'Thừa mỡ';
                adv = 'Nên tập luyện và cân nhắc chế độ ăn uống.';
            } else {
                classif = 'Béo phì';
                adv = 'Cần thay đổi lối sống và tham khảo ý kiến chuyên gia.';
            }
        } else {
            if (bf < 14) {
                classif = 'Quá thấp';
                adv = 'Cần tăng cân và tăng lượng mỡ cơ thể lành mạnh.';
            } else if (bf < 25) {
                classif = 'Bình thường';
                adv = 'Mức mỡ cơ thể hợp lý, duy trì lối sống hiện tại.';
            } else if (bf < 32) {
                classif = 'Thừa mỡ';
                adv = 'Nên tập luyện và cân nhắc chế độ ăn uống.';
            } else {
                classif = 'Béo phì';
                adv = 'Cần thay đổi lối sống và tham khảo ý kiến chuyên gia.';
            }
        }

        setClassification(classif);
        setAdvice(adv);
    };

    return (
        <div className="calculator">
            <h3>Tỷ lệ mỡ cơ thể (ước lượng)</h3>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
            </select>
            <input placeholder="BMI hiện tại" value={bmi} onChange={(e) => setBmi(e.target.value)} />
            <input placeholder="Tuổi" value={age} onChange={(e) => setAge(e.target.value)} />
            <button onClick={calculateBodyFat}>Tính</button>

            {bodyFat && (
                <>
                    <p>Kết quả: <strong>{bodyFat}%</strong> mỡ cơ thể (ước lượng)</p>
                    <p><em>Phân loại:</em> {classification}</p>
                    <p><em>Lời khuyên:</em> {advice}</p>

                    <table className="bmi-table">
                        <thead>
                            <tr><th>Phân loại</th><th>Tỷ lệ mỡ (%)</th><th>Màu</th></tr>
                        </thead>
                        <tbody>
                            {gender === 'male' ? (
                                <>
                                    <tr className={classification === 'Quá thấp' ? 'highlight' : ''}><td>Quá thấp</td><td>{'< 6%'}</td><td style={{ backgroundColor: '#a2d5f2' }}></td></tr>
                                    <tr className={classification === 'Bình thường' ? 'highlight' : ''}><td>Bình thường</td><td>6% – 17%</td><td style={{ backgroundColor: '#8fd694' }}></td></tr>
                                    <tr className={classification === 'Thừa mỡ' ? 'highlight' : ''}><td>Thừa mỡ</td><td>17% – 25%</td><td style={{ backgroundColor: '#f5e960' }}></td></tr>
                                    <tr className={classification === 'Béo phì' ? 'highlight' : ''}><td>Béo phì</td><td>{`>`} 25%</td><td style={{ backgroundColor: '#f76060' }}></td></tr>
                                </>
                            ) : (
                                <>
                                    <tr className={classification === 'Quá thấp' ? 'highlight' : ''}><td>Quá thấp</td><td>{'< 14%'}</td><td style={{ backgroundColor: '#a2d5f2' }}></td></tr>
                                    <tr className={classification === 'Bình thường' ? 'highlight' : ''}><td>Bình thường</td><td>14% – 25%</td><td style={{ backgroundColor: '#8fd694' }}></td></tr>
                                    <tr className={classification === 'Thừa mỡ' ? 'highlight' : ''}><td>Thừa mỡ</td><td>25% – 32%</td><td style={{ backgroundColor: '#f5e960' }}></td></tr>
                                    <tr className={classification === 'Béo phì' ? 'highlight' : ''}><td>Béo phì</td><td>{`>`} 32%</td><td style={{ backgroundColor: '#f76060' }}></td></tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};




// --- Main Page ---
const HealthCalculatorPage = () => {
    const [activeTab, setActiveTab] = useState('bmi');

    return (
        <div className="health-page" >
            <h2>Công Cụ Tính Toán Sức Khỏe</h2>

            <div className="tab-bar">
                <button onClick={() => setActiveTab('bmi')} className={activeTab === 'bmi' ? 'active' : ''}>BMI</button>
                <button onClick={() => setActiveTab('hydration')} className={activeTab === 'hydration' ? 'active' : ''}>Nước</button>
                <button onClick={() => setActiveTab('calorie')} className={activeTab === 'calorie' ? 'active' : ''}>Calo</button>
                <button onClick={() => setActiveTab('ibw')} className={activeTab === 'ibw' ? 'active' : ''}>IBW</button>
                <button onClick={() => setActiveTab('bmr')} className={activeTab === 'bmr' ? 'active' : ''}>BMR</button>
                <button onClick={() => setActiveTab('whr')} className={activeTab === 'whr' ? 'active' : ''}>WHR</button>
                <button onClick={() => setActiveTab('whtr')} className={activeTab === 'whtr' ? 'active' : ''}>WHtR</button>
                <button onClick={() => setActiveTab('bodyfat')} className={activeTab === 'bodyfat' ? 'active' : ''}>Mỡ cơ thể</button>
            </div>

            <div className="tool-area">
                {activeTab === 'bmi' && <BMICalculator />}
                {activeTab === 'hydration' && <HydrationCalculator />}
                {activeTab === 'calorie' && <CalorieIntakeCalculator />}
                {activeTab === 'ibw' && <IBWCalculator />}
                {activeTab === 'bmr' && <BMRCalculator />}
                {activeTab === 'whr' && <WHRCalculator />}
                {activeTab === 'whtr' && <WHtRCalculator />}
                {activeTab === 'bodyfat' && <BodyFatCalculator />}
            </div>
        </div>
    );
};

export default HealthCalculatorPage;
