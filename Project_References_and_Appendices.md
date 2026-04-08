# References and Appendices

This document contains the supplementary materials for the Construction License Management System (CLMS) project, including academic references, technical samples, and data descriptions.

---

## ❖ References

1. **Django Software Foundation**. (2026). _Django REST Framework Documentation_. Retrieved from https://www.django-rest-framework.org/
2. **Next.js Team**. (2026). _Next.js 15 App Router Documentation_. Retrieved from https://nextjs.org/docs
3. **Google AI**. (2025). _Gemini 2.0 Technical Report: Multimodal Document Understanding_.
4. **DeepSeek AI**. (2025). _DeepSeek-V3: Scalable and Efficient Language Models_.
5. **Chapa Financial Technologies**. (2026). _Developer API Reference for Digital Payments_.
6. **Fielding, R. T.** (2000). _Architectural Styles and the Design of Network-based Software Architectures_ (RESTful API Principles).
7. **PostgreSQL Global Development Group**. (2026). _PostgreSQL 17 Documentation_.

---

## ❖ Appendix 1: List of Questionnaires

### A. Pre-Implementation Survey (Target: Manual Reviewers)

1. How many hours on average do you spend verifying a single contractor license application?
2. What is the most common reason for application rejection?
3. On a scale of 1-10, how confident are you in detecting forged bank statements manually?

### B. User Satisfaction Survey (Target: Applicants)

1. Was the digital application process easier than the previous manual method?
2. Did you find the real-time notifications (Email/Dashboard) helpful?
3. How would you rate the speed of the automated document verification system?

---

## ❖ Appendix 2: Sample Code

### A. AI Verification Logic ([verification.py](file:///c:/Users/pc/OneDrive/Telegram%20Desktop/Desktop/final_year/backend/applications/verification.py))

This snippet shows how the system constructs the prompt and parses the JSON response from the AI provider.

```python
def perform_verification(documents, category_name):
    # Constructing the AI prompt
    prompt = f"Analyze the following document and verify if it matches '{category_name}'..."

    # Calling the AI Provider (Gemini/DeepSeek)
    response = call_ai_provider(prompt, documents)

    # Parsing structured JSON output
    result = json.loads(response.text)
    return result
```

### B. Payment Integration ([chapa_service.py](file:///c:/Users/pc/OneDrive/Telegram%20Desktop/Desktop/final_year/backend/payments/services/chapa_service.py))

Logic for initializing a secure transaction with the Chapa gateway.

```python
def initialize_payment(amount, email, reference):
    payload = {
        "amount": amount,
        "currency": "ETB",
        "email": email,
        "tx_ref": reference,
        "callback_url": settings.CHAPA_CALLBACK_URL
    }
    return requests.post(CHAPA_API_URL, json=payload, headers=headers)
```

---

## ❖ Appendix 3: Sample Dataset

### Example: AI Verification JSON Response

The following is a sample of the raw data returned by the AI engine after auditing a Business License.

```json
{
  "confidenceScore": 0.98,
  "finalRecommendation": "APPROVED",
  "summary": "The document is a valid 2016 Business License for Abebe Kebede Construction.",
  "extractedEntities": {
    "company_name": "Abebe Kebede Construction",
    "license_number": "BL/2016/9982",
    "expiry_date": "2026-12-31",
    "grade": "Grade 5"
  },
  "checks": {
    "authenticity": true,
    "expiry_valid": true,
    "stamp_detected": true
  }
}
```

---

## ❖ Appendix 4: Attribute Description

### Application Model Attributes

| Attribute      | Type        | Description                                        |
| :------------- | :---------- | :------------------------------------------------- |
| `id`           | UUID        | Unique identifier for the application.             |
| `applicant`    | ForeignKey  | Reference to the User who submitted the form.      |
| `license_type` | CharField   | Type of license (Contractor, Professional, etc.).  |
| `status`       | ChoiceField | Current state (Pending, Approved, Rejected, etc.). |
| `created_at`   | DateTime    | Timestamp of initial submission.                   |

### License Model Attributes

| Attribute     | Type       | Description                                |
| :------------ | :--------- | :----------------------------------------- |
| `license_no`  | CharField  | Unique government-issued license number.   |
| `issue_date`  | Date       | Date the license was officially activated. |
| `expiry_date` | Date       | Date the license requires renewal.         |
| `qr_code`     | ImageField | Unique QR code for public verification.    |
