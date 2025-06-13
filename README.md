# Stuntguard API Documentation

Welcome to the Stuntguard API! This API provides endpoints for user authentication, stunting check management, and forum interactions. It supports user registration, login (via email or Google), password management, profile updates, stunting data tracking, and forum messaging with replies.

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm
- Docker (optional, for running with Docker)
- Git

### Running the Project Locally

To run the project locally, follow these steps:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/CC25-CF172/Stuntguard-API.git
   cd stuntguard-api
   ```
2. **Install Python Dependencies:** :
   If the project includes Python dependencies, install them using the requirements.txt file:
   `bash
pip install -r requirements.txt
`

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Start the Application**
   ```bash
   npm run start
   ```

### Running with Docker

To run the project using Docker, follow these steps:

1. **Clone the Repository**

   ```bash
   git clone https://github.com/CC25-CF172/Stuntguard-API.git

   cd stuntguard-api
   ```

2. **Install Dependencies**

   ```bash
   docker build -t stuntguard-api .
   ```

3. **Start the Application**
   ```bash
   docker run -p 5000:5000 stuntguard-api
   ```

## Base URL

```bash
https://stuntguard-api-production.up.railway.app
```

## Endpoints

### Home

```http
GET /
```

**Response**: Serves the Stuntguard API documentation page as HTML.

Returns the API documentation as an HTML page, providing an overview of all available endpoints and their usage. If the page cannot be loaded, a JSON error response is returned.

```http
HTTP 200: [HTML content of the API documentation page]
```

**Error Response** (if file serving fails):

```json
{ "success": false, "message": "Failed to retrieve homepage." }
```

### API Information

```http
GET /api/v1
```

**Response**: JSON object with API details.

```json
{
  "name": "Stuntguard API",
  "version": "1.0.0",
  "description": "Stuntguard API is a backend service providing user authentication, stunting health check management, and community forum features. It supports secure user registration and login, password recovery, profile updates, comprehensive stunting data tracking and analysis, and interactive forum discussions with replies."
}
```

### Authentication

All endpoints except `GET /`, `GET /api/v1`, `POST /api/v1/register`, `POST /api/v1/login`, `POST /api/v1/auth/callback/google`, `POST /api/v1/forgot-password`, and `POST /api/v1/reset-password` require a valid JWT token in the `Authorization` header as `Bearer <token>`.

- **Register**

```http
POST /api/v1/register
```

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Required. User's full name. |
| `email` | `string` | Required. Valid email address. |
| `password` | `string` | Required. Minimum 6 characters. |

**Response**: JSON object with a JWT token or error message.

```json
{
  "success": true,
  "data": { "token": "<JWT_TOKEN>" },
  "message": "User registered successfully."
}
```

- **Login (Email)**

```http
POST /api/v1/login
```

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `provider` | `string` | Required. Must be `"email"`. |
| `user` | `object` | Required. Contains email and password. |
| `user.email` | `string` | Required. Valid email address. |
| `user.password` | `string` | Required. Minimum 6 characters. |

**Response**: JSON object with a JWT token or error message.

```json
{
  "success": true,
  "data": { "token": "<JWT_TOKEN>" },
  "message": "User login successful."
}
```

- **Login (Google)**

```http
POST /api/v1/auth/callback/google
```

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `provider` | `string` | Required. Must be `"google"`. |
| `user` | `object` | Required. Contains email. |
| `user.email` | `string` | Required. Valid email address. |

**Response**: JSON object with a JWT token or error message.

```json
{
  "success": true,
  "data": { "token": "<JWT_TOKEN>" },
  "message": "User login successful."
}
```

- **Forgot Password**

```http
POST /api/v1/forgot-password
```

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `email` | `string` | Required. Valid email address. |

**Response**: JSON object confirming reset link sent or error message.

```json
{
  "success": true,
  "message": "Password reset link sent to your email."
}
```

- **Reset Password**

```http
POST /api/v1/reset-password
```

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `token` | `string` | Required. Password reset token. |
| `new_password` | `string` | Required. New password, minimum 6 characters. |

**Response**: JSON object confirming password reset or error message.

```json
{
  "success": true,
  "message": "Password has been reset successfully."
}
```

- **Edit Profile**

```http
PUT /api/v1/edit-profile
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Optional. User's full name. |
| `email` | `string` | Optional. Valid email address. |
| `new_password` | `string` | Optional. New password, minimum 6 characters. |

**Response**: JSON object with updated profile details or error message.

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": { "id": 1, "name": "New Name", "email": "new.email@example.com", ... }
}
```

### Stunting Checks

- **Get All Stunting Checks**

```http
GET /api/v1/stunting
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Response**: Array of stunting check records, each including a status field.

```json
{
  "success": true,
  "message": "Stunting data retrieved successfully.",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "recommendation_id": 4,
      "gender": "male",
      "age_months": 12,
      "birth_weight_kg": 3.5,
      "birth_length_cm": 50,
      "current_weight_kg": 10,
      "current_length_cm": 75,
      "exclusive_breastfeeding": "yes",
      "stunting_probability": 0.1,
      "stunting_prediction": "negative",
      "who_classification": "normal",
      "height_for_age_z_score": -0.5,
      "created_at": "2025-05-22T23:00:00.000Z",
      "updated_at": "2025-05-22T23:00:00.000Z",
      "risk_type": "Normal",
      "recommendation_notes": {
                "JadwalKontrol": [
                    "Kontrol rutin ke Posyandu: Setiap bulan",
                    "Kunjungan ke dokter anak: Setiap 3-6 bulan untuk pemeriksaan tumbuh kembang"
                ],
                "RekomendasiGizi": [
                    "Berikan ASI eksklusif hingga 6 bulan (jika usia < 6 bulan)",
                    "Lanjutkan pemberian ASI hingga 2 tahun dengan MPASI yang bergizi",
                    "Pastikan asupan protein hewani setiap hari (telur, ikan, daging, susu)",
                    "Berikan makanan beragam dengan 4 bintang (karbohidrat, protein, lemak, vitamin-mineral)",
                    "Hindari makanan tinggi gula dan garam berlebihan"
                ],
                "RekomendasiUtama": [
                    "Pertahankan pola asuh dan gizi yang sudah baik",
                    "Lanjutkan pemantauan rutin pertumbuhan dan perkembangan",
                    "Tetap berikan stimulasi optimal untuk perkembangan anak"
                ],
                "RekomendasiPerawatan": [
                    "Kunjungi Posyandu setiap bulan untuk pemantauan berat dan tinggi badan",
                    "Lengkapi imunisasi sesuai jadwal",
                    "Jaga kebersihan diri dan lingkungan",
                    "Berikan stimulasi bermain dan belajar sesuai usia"
                ]
            }
    },
    ...
  ]
}
```

- **Get Stunting Check by ID**

```http
GET /api/v1/stunting/{id}
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Required. Stunting check ID. |

**Response**: Details of the specified stunting check, including status.

```json
{
  "success": true,
  "message": "Stunting data retrieved successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "recommendation_id": 4,
    "gender": "male",
    "age_months": 12,
    "birth_weight_kg": 3.5,
    "birth_length_cm": 50,
    "current_weight_kg": 10,
    "current_length_cm": 75,
    "exclusive_breastfeeding": "yes",
    "stunting_probability": 0.1,
    "stunting_prediction": "negative",
    "who_classification": "normal",
    "height_for_age_z_score": -0.5,
    "created_at": "2025-05-22T23:00:00.000Z",
    "updated_at": "2025-05-22T23:00:00.000Z",
    "risk_type": "Normal",
    "recommendation_notes": {
      "JadwalKontrol": [
        "Kontrol rutin ke Posyandu: Setiap bulan",
        "Kunjungan ke dokter anak: Setiap 3-6 bulan untuk pemeriksaan tumbuh kembang"
      ],
      "RekomendasiGizi": [
        "Berikan ASI eksklusif hingga 6 bulan (jika usia < 6 bulan)",
        "Lanjutkan pemberian ASI hingga 2 tahun dengan MPASI yang bergizi",
        "Pastikan asupan protein hewani setiap hari (telur, ikan, daging, susu)",
        "Berikan makanan beragam dengan 4 bintang (karbohidrat, protein, lemak, vitamin-mineral)",
        "Hindari makanan tinggi gula dan garam berlebihan"
      ],
      "RekomendasiUtama": [
        "Pertahankan pola asuh dan gizi yang sudah baik",
        "Lanjutkan pemantauan rutin pertumbuhan dan perkembangan",
        "Tetap berikan stimulasi optimal untuk perkembangan anak"
      ],
      "RekomendasiPerawatan": [
        "Kunjungi Posyandu setiap bulan untuk pemantauan berat dan tinggi badan",
        "Lengkapi imunisasi sesuai jadwal",
        "Jaga kebersihan diri dan lingkungan",
        "Berikan stimulasi bermain dan belajar sesuai usia"
      ]
    }
  }
}
```

- **Get Stunting History by User ID**

```http
GET /api/v1/stunting/history/{user_id}
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | `number` | Required. User ID. |

**Response**: Array of stunting check records for the user.

```json
{
  "success": true,
  "message": "Stunting history retrieved successfully.",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "recommendation_id": 4,
      "gender": "male",
      "age_months": 12,
      "birth_weight_kg": 3.5,
      "birth_length_cm": 50,
      "current_weight_kg": 10,
      "current_length_cm": 75,
      "exclusive_breastfeeding": "yes",
      "stunting_probability": 0.1,
      "stunting_prediction": "negative",
      "who_classification": "normal",
      "height_for_age_z_score": -0.5,
      "created_at": "2025-05-22T23:00:00.000Z",
      "updated_at": "2025-05-22T23:00:00.000Z",
      "risk_type": "Normal",
      "recommendation_notes": {
                "JadwalKontrol": [
                    "Kontrol rutin ke Posyandu: Setiap bulan",
                    "Kunjungan ke dokter anak: Setiap 3-6 bulan untuk pemeriksaan tumbuh kembang"
                ],
                "RekomendasiGizi": [
                    "Berikan ASI eksklusif hingga 6 bulan (jika usia < 6 bulan)",
                    "Lanjutkan pemberian ASI hingga 2 tahun dengan MPASI yang bergizi",
                    "Pastikan asupan protein hewani setiap hari (telur, ikan, daging, susu)",
                    "Berikan makanan beragam dengan 4 bintang (karbohidrat, protein, lemak, vitamin-mineral)",
                    "Hindari makanan tinggi gula dan garam berlebihan"
                ],
                "RekomendasiUtama": [
                    "Pertahankan pola asuh dan gizi yang sudah baik",
                    "Lanjutkan pemantauan rutin pertumbuhan dan perkembangan",
                    "Tetap berikan stimulasi optimal untuk perkembangan anak"
                ],
                "RekomendasiPerawatan": [
                    "Kunjungi Posyandu setiap bulan untuk pemantauan berat dan tinggi badan",
                    "Lengkapi imunisasi sesuai jadwal",
                    "Jaga kebersihan diri dan lingkungan",
                    "Berikan stimulasi bermain dan belajar sesuai usia"
                ]
            }
    },
    ...
  ]
}
```

- **Create Stunting Check**

```http
POST /api/v1/stunting
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `gender` | `string` | Required. Child's gender (e.g., "male", "female"). |
| `age_months` | `number` | Required. Child's age in months (0-60). |
| `birth_weight_kg` | `number` | Required. Birth weight in kilograms (positive). |
| `birth_length_cm` | `number` | Required. Birth length in centimeters (positive). |
| `current_weight_kg` | `number` | Required. Current weight in kilograms (positive). |
| `current_length_cm` | `number` | Required. Current length in centimeters (positive). |
| `exclusive_breastfeeding` | `string` | Required. Breastfeeding status (e.g., "yes", "no"). |

**Response**: Success message and stunting check details, including risk type and recommendation notes.

```json
{
  "success": true,
  "message": "Insert data successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "recommendation_id": 4,
    "gender": "male",
    "age_months": 12,
    "birth_weight_kg": 3.5,
    "birth_length_cm": 50,
    "current_weight_kg": 10,
    "current_length_cm": 75,
    "exclusive_breastfeeding": "yes",
    "stunting_probability": 0.1,
    "stunting_prediction": "negative",
    "who_classification": "normal",
    "height_for_age_z_score": -0.5,
    "created_at": "2025-05-22T23:00:00.000Z",
    "updated_at": "2025-05-22T23:00:00.000Z",
    "risk_type": "Normal",
    "recommendation_notes": {
      "JadwalKontrol": [
        "Kontrol rutin ke Posyandu: Setiap bulan",
        "Kunjungan ke dokter anak: Setiap 3-6 bulan untuk pemeriksaan tumbuh kembang"
      ],
      "RekomendasiGizi": [
        "Berikan ASI eksklusif hingga 6 bulan (jika usia < 6 bulan)",
        "Lanjutkan pemberian ASI hingga 2 tahun dengan MPASI yang bergizi",
        "Pastikan asupan protein hewani setiap hari (telur, ikan, daging, susu)",
        "Berikan makanan beragam dengan 4 bintang (karbohidrat, protein, lemak, vitamin-mineral)",
        "Hindari makanan tinggi gula dan garam berlebihan"
      ],
      "RekomendasiUtama": [
        "Pertahankan pola asuh dan gizi yang sudah baik",
        "Lanjutkan pemantauan rutin pertumbuhan dan perkembangan",
        "Tetap berikan stimulasi optimal untuk perkembangan anak"
      ],
      "RekomendasiPerawatan": [
        "Kunjungi Posyandu setiap bulan untuk pemantauan berat dan tinggi badan",
        "Lengkapi imunisasi sesuai jadwal",
        "Jaga kebersihan diri dan lingkungan",
        "Berikan stimulasi bermain dan belajar sesuai usia"
      ]
    }
  }
}
```

- **Update Stunting Check**

```http
PUT /api/v1/stunting/{id}
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Required. Stunting check ID. |

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `gender` | `string` | Required. Child's gender (e.g., "male", "female"). |
| `age_months` | `number` | Required. Child's age in months (0-60). |
| `birth_weight_kg` | `number` | Required. Birth weight in kilograms (positive). |
| `birth_length_cm` | `number` | Required. Birth length in centimeters (positive). |
| `current_weight_kg` | `number` | Required. Current weight in kilograms (positive). |
| `current_length_cm` | `number` | Required. Current length in centimeters (positive). |
| `exclusive_breastfeeding` | `string` | Required. Breastfeeding status (e.g., "yes", "no"). |

**Response**: Success message and updated stunting check details, including risk type and recommendation notes.

```json
{
  "success": true,
  "message": "Stunting data updated successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "recommendation_id": 4,
    "gender": "male",
    "age_months": 12,
    "birth_weight_kg": 3.5,
    "birth_length_cm": 50,
    "current_weight_kg": 10,
    "current_length_cm": 75,
    "exclusive_breastfeeding": "yes",
    "stunting_probability": 0.1,
    "stunting_prediction": "negative",
    "who_classification": "normal",
    "height_for_age_z_score": -0.5,
    "created_at": "2025-05-22T23:00:00.000Z",
    "updated_at": "2025-05-22T23:00:00.000Z",
    "risk_type": "Normal",
    "recommendation_notes": {
      "JadwalKontrol": [
        "Kontrol rutin ke Posyandu: Setiap bulan",
        "Kunjungan ke dokter anak: Setiap 3-6 bulan untuk pemeriksaan tumbuh kembang"
      ],
      "RekomendasiGizi": [
        "Berikan ASI eksklusif hingga 6 bulan (jika usia < 6 bulan)",
        "Lanjutkan pemberian ASI hingga 2 tahun dengan MPASI yang bergizi",
        "Pastikan asupan protein hewani setiap hari (telur, ikan, daging, susu)",
        "Berikan makanan beragam dengan 4 bintang (karbohidrat, protein, lemak, vitamin-mineral)",
        "Hindari makanan tinggi gula dan garam berlebihan"
      ],
      "RekomendasiUtama": [
        "Pertahankan pola asuh dan gizi yang sudah baik",
        "Lanjutkan pemantauan rutin pertumbuhan dan perkembangan",
        "Tetap berikan stimulasi optimal untuk perkembangan anak"
      ],
      "RekomendasiPerawatan": [
        "Kunjungi Posyandu setiap bulan untuk pemantauan berat dan tinggi badan",
        "Lengkapi imunisasi sesuai jadwal",
        "Jaga kebersihan diri dan lingkungan",
        "Berikan stimulasi bermain dan belajar sesuai usia"
      ]
    }
  }
}
```

- **Delete Stunting Check**

```http
DELETE /api/v1/stunting/{id}
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Required. Stunting check ID. |

**Response**: Success message.

```json
{
  "success": true,
  "message": "Stunting data deleted successfully."
}
```

### Forum

- **Get All Forum Messages**

```http
GET /api/v1/forum
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Response**: Array of all forum messages.

```json
{
  "success": true,
  "message": "Forum data retrieved successfully.",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "user_name": "vio",
      "title": "Discussion on Child Nutrition",
      "content": "What are the best foods for toddlers?",
      "status": true,
      "created_at": "2025-05-22T23:00:00.000Z",
      "updated_at": "2025-05-22T23:00:00.000Z"
    },
    ...
  ]
}
```

- **Get Forum Message by ID**

```http
GET /api/v1/forum/{id}
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Required. Forum message ID. |

**Response**: Details of the specified forum message.

```json
{
  "success": true,
  "message": "Forum data retrieved successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "user_name": "vio",
    "title": "Discussion on Child Nutrition",
    "content": "What are the best foods for toddlers?",
    "status": true,
    "created_at": "2025-05-22T23:00:00.000Z",
    "updated_at": "2025-05-22T23:00:00.000Z"
  }
}
```

- **Create Forum Message**

```http
POST /api/v1/forum
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Required. Message title. |
| `content` | `string` | Required. Message content. |

**Response**: Success message and forum message details.

```json
{
  "success": true,
  "message": "Insert data successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "Discussion on Child Nutrition",
    "content": "What are the best foods for toddlers?",
    "status": true,
    "created_at": "2025-05-22T23:00:00.000Z",
    "updated_at": "2025-05-22T23:00:00.000Z"
  }
}
```

- **Update Forum Message**

```http
PUT /api/v1/forum/{id}
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Required. Forum message ID. |

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Optional. Message title. |
| `content` | `string` | Optional. Message content. At least one of `title` or `content` must be provided. |

**Response**: Success message and updated forum message details.

```json
{
  "success": true,
  "message": "Forum data updated successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "Updated Discussion on Child Nutrition",
    "content": "What are the best foods for toddlers?",
    "status": true,
    "created_at": "2025-05-22T23:00:00.000Z",
    "updated_at": "2025-05-22T23:30:00.000Z"
  }
}
```

- **Delete Forum Message**

```http
DELETE /api/v1/forum/{id}
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Required. Forum message ID. |

**Response**: Success message.

```json
{
  "success": true,
  "message": "Forum data deleted successfully."
}
```

### Forum Replies

- **Get All Forum Replies**

```http
GET /api/v1/forum-replies
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Response**: Array of all forum replies.

```json
{
  "success": true,
  "message": "Forum replies retrieved successfully.",
  "data": [
    {
      "id": 1,
      "forum_id": 1,
      "user_id": 2,
      "user_name": "vio",
      "content": "I recommend high-protein foods like eggs.",
      "created_at": "2025-05-22T23:10:00.000Z",
      "updated_at": "2025-05-22T23:10:00.000Z"
    },
    ...
  ]
}
```

- **Get Forum Reply by ID**

```http
GET /api/v1/forum-replies/{id}
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Required. Forum reply ID. |

**Response**: Details of the specified forum reply.

```json
{
  "success": true,
  "message": "Forum reply retrieved successfully.",
  "data": {
    "id": 1,
    "forum_id": 1,
    "user_id": 2,
    "user_name": "vio",
    "content": "I recommend high-protein foods like eggs.",
    "created_at": "2025-05-22T23:10:00.000Z",
    "updated_at": "2025-05-22T23:10:00.000Z"
  }
}
```

- **Create Forum Reply**

```http
POST /api/v1/forum-replies
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `forum_id` | `number` | Required. ID of the forum message being replied to. |
| `content` | `string` | Required. Reply content. |

**Response**: Success message and forum reply details.

```json
{
  "success": true,
  "message": "Forum reply added successfully.",
  "data": {
    "id": 1,
    "forum_id": 1,
    "user_id": 2,
    "content": "I recommend high-protein foods like eggs.",
    "created_at": "2025-05-22T23:10:00.000Z",
    "updated_at": "2025-05-22T23:10:00.000Z"
  }
}
```

- **Update Forum Reply**

```http
PUT /api/v1/forum-replies/{id}
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Required. Forum reply ID. |

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `content` | `string` | Required. Reply content. |

**Response**: Success message and updated forum reply details.

```json
{
  "success": true,
  "message": "Forum reply updated successfully.",
  "data": {
    "id": 1,
    "forum_id": 1,
    "user_id": 2,
    "content": "Updated: I recommend high-protein foods like eggs and lentils.",
    "created_at": "2025-05-22T23:10:00.000Z",
    "updated_at": "2025-05-22T23:30:00.000Z"
  }
}
```

- **Delete Forum Reply**

```http
DELETE /api/v1/forum-replies/{id}
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Required. Forum reply ID. |

**Response**: Success message.

```json
{
  "success": true,
  "message": "Forum reply deleted successfully."
}
```

### Chatbot

- **Get Chatbot Response**

```http
POST /api/v1/chatbot
```

**Authorization**: Bearer `<JWT_TOKEN>`

**Body**:
| Field | Type | Description |
|-------|------|-------------|
| `message` | `string` | Required. User's message or question related to stunting. |

**Response**: Success message and chatbot's response to the input message.

```json
{
  "success": true,
  "data": {
    "reply": "Stunting adalah kondisi gagal tumbuh pada anak yang menyebabkan tinggi badan tidak sesuai dengan usianya, biasanya akibat kekurangan gizi kronis."
  },
  "message": "Successfully processed message."
}
```

**Example Request**:

```json
{
  "message": "apa itu stunting"
}
```

**Example Response**:

```json
{
  "success": true,
  "data": {
    "reply": "Stunting adalah kondisi gagal tumbuh pada anak yang menyebabkan tinggi badan tidak sesuai dengan usianya, biasanya akibat kekurangan gizi kronis."
  },
  "message": "Successfully processed message."
}
```

**Error Responses**:

- **400 Bad Request** (missing message):
  ```json
  {
    "success": false,
    "message": "No message provided."
  }
  ```
- **400 Bad Request** (chatbot processing failed):
  ```json
  {
    "success": false,
    "message": "Chatbot processing failed"
  }
  ```
- **401 Unauthorized** (invalid or missing token):
  ```json
  {
    "success": false,
    "message": "Invalid token"
  }
  ```
- **500 Internal Server Error** (server or model error):
  ```json
  {
    "success": false,
    "message": "Failed to process chatbot response"
  }
  ```
