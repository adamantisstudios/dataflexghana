# FORM A (Adobe Fillable PDF) – AI Mapping Specification

## Purpose
This mapping uses the **actual Adobe AcroForm field names** extracted from the PDF. An AI should populate the PDF using the exact field names below.

## Section A – Business Registration

| Canonical Key | Adobe PDF Field Name |
|---|---|
| business_name | BUSINESS NAME 7 |
| business_name_alt_1 | BUSINESS NAME 8 |
| business_name_alt_2 | BUSINESS NAME 9 |
| business_name_alt_3 | BUSINESS NAME 10 |

## Section B – Sector Checkboxes

| Canonical Key | Adobe PDF Field Name |
|---|---|
| sector_legal | LEGAL |
| sector_media | MEDIA |
| sector_estate_housing | ESTATE/HOUSING |
| sector_transport_aerospace | TRANSPORT/AEROSPACE |
| sector_utilities | UTILITIES |
| sector_education | EDUCATION |
| sector_telecom_ict | TELECOM/ICT |
| sector_security | SECURITY |
| sector_construction | CONSTRUCTION |
| sector_pharmaceutical | PHARMACEUTICAL |
| sector_banking_finance | BANKING AND FINANCCE |
| sector_oil_gas | OIL AND GAS |
| sector_manufacturing | MANUFACTURING |
| sector_commerce_trading | COMMERCE/TRAIDING |
| sector_agriculture | AGRICULTURE |
| sector_food_industry | FOOD INDUSTRY |
| sector_securities_brokers | SECURITIES/BROKERS |
| sector_other | OTHERS (Please Speccify) |
| sector_tourism | TOURISM |
| sector_quarry_mining | QUARRY/MINING |
| sector_hospitality | HOSPITALITY |
| sector_fashion_beautification | FASHION/BEAUTIFICATION |

## Section C – ISIC

| Canonical Key | Adobe PDF Field Name |
|---|---|
| isic_code_1 | ISIC CODE 1 |
| isic_code_2 | ISIC CODE 2 |
| isic_code_3 | ISIC CODE 3 |
| business_activity_description | ISIC CODE 4 |

## Section D – Registered Office Address

| Canonical Key | Adobe PDF Field Name |
|---|---|
| date_of_commencement | DATE OF COMMENCEMENT |
| registered_digital_address | DIGITAL ADDRESS |
| registered_building | HOUSE/BUILDING/FLAT |
| registered_street | STREET NAME |
| registered_city | CITY |

## Section E – Principal Place of Business

| Canonical Key | Adobe PDF Field Name |
|---|---|
| same_as_registered_yes | IS PRINCIPAL PLACE OF BUSINESS SAME AS REGSITERED OFFICE? (YES) |
| principal_building | PRINCIPAL PLACE OF BUSINESS (HOUSE/BUILDING/FLAT) |
| principal_street | PRINCIPAL PLACE OF BUSINESS (STREET NAME) |
| principal_city | PRINCIPAL PLACE OF BUSINESS (CITY) |
| principal_district | PRINCIPAL PLACE OF BUSINESS (DISTRICT) |
| principal_region | PRINCIPAL PLACE OF BUSINESS (REGION) |
| principal_digital_address | PRINCIPAL PLACE OF BUSINESS (DIGITAL ADDRESS) |
| owner_occupied | OWNER OCCPIED |
| rented | RENTED |
| free_use | FREE USE |
| part_rented_yes | IF OWNER OCCUPIED IS IT PART RENTED? YES |
| part_rented_no | IF OWNER OCCUPIED IS IT PART RENTED? NO |
| landlord_name | LANDLORDS NAME |

## Section F – Other Place of Business

| Canonical Key | Adobe PDF Field Name |
|---|---|
| other_building | OTHER PLACE OF BUSINESS (HOUSE/BUILDING/FLAT) |
| other_street | OTHER PLACE OF BUSINESS (STREET NAME) |
| other_city | OTHER PLACE OF BUSINESS (CITY) |
| other_district | OTHER PLACE OF BUSINESS (DISTRICT) |
| other_region | OTHER PLACE OF BUSINESS (REGION) |
| other_digital_address | OTHER PLACE OF BUSINESS (DIGITAL ADDRESS) |

## Section G – Postal Address

| Canonical Key | Adobe PDF Field Name |
|---|---|
| postal_care_of | POSTAL ADDRESSS C/O 1 |
| postal_type_pobox | P O BOX |
| postal_type_pmb | PMB |
| postal_type_dtd | DTD |
| postal_number | POSTAL ADDRESS (NUMBER) |
| postal_town | POSTAL ADDRESS (TOWN) |
| postal_region | POSTAL ADDRESS (REGION) |

## Section H – Contact

| Canonical Key | Adobe PDF Field Name |
|---|---|
| phone_no_1 | POSTAL ADDRESS (CONTACT No 1) |
| phone_no_2 | POSTAL ADDRESS (CONTACT No 2) |
| mobile_no_1 | POSTAL ADDRESS (MOBILE No 1) |
| mobile_no_2 | POSTAL ADDRESS (MOBILE No 2) |
| email | POSTAL ADDRESS (EMAIL) |
| fax | POSTAL ADDRESS (FAX) |
| website | POSTAL ADDRESS (WEBSITE) |

## Section I – Proprietor

| Canonical Key | Adobe PDF Field Name |
|---|---|
| title_mr | PROPRIETOR/PROPRIETRRESS TITLE (MR) |
| title_mrs | PROPRIETOR/PROPRIETRRESS TITLE (MRS) |
| title_miss | PROPRIETOR/PROPRIETRRESS TITLE (MISS) |
| title_ms | PROPRIETOR/PROPRIETRRESS TITLE (MS) |
| first_name | PROPRIETOR/PROPRIETRRESS (FIRST NAME) |
| middle_name | PROPRIETOR/PROPRIETRRESS (MIDDLE NAME) |
| last_name | PROPRIETOR/PROPRIETRRESS (LAST NAME) |
| former_name | PROPRIETOR/PROPRIETRRESS (FORMER NAME) |
| dob | PROPRIETOR/PROPRIETRRESS (DATE OF BIRTH) |
| gender_male | PROPRIETOR/PROPRIETRESS GENDER (MALE) |
| gender_female | PROPRIETOR/PROPRIETRESS GENDER (FEMALE) |

## Section J/K – Residential & Identity

| Canonical Key | Adobe PDF Field Name |
|---|---|
| nationality | PROPRIETOR/PROPRIETRRESS (NATIONALITY) |
| occupation | PROPRIETOR/PROPRIETRRESS (OCCUPATION) |
| ghana_card | PROPRIETOR/PROPRIETRRESS (GHANA CARD) |
| tin | PROPRIETOR/PROPRIETRRESS (TIN) |
| proprietor_email | PROPRIETOR/PROPRIETRRESS (EMAIL) |
| proprietor_mobile_1 | PROPRIETOR/PROPRIETRRESS (MOBILE N0 1) |
| proprietor_mobile_2 | PROPRIETOR/PROPRIETRRESS (MOBILEE N0 2) |
| proprietor_fax | PROPRIETOR/PROPRIETRRESS (FAX) |
| residential_district | PROPRIETOR/PROPRIETRRESS (DISTRICT) |
| residential_region | PROPRIETOR/PROPRIETRRESS (REGION) |
| residential_country | PROPRIETOR/PROPRIETRRESS (COUNTRY) |

## Section L – MSME

| Canonical Key | Adobe PDF Field Name |
|---|---|
| projected_revenue | PROPRIETOR/PROPRIETRRESS (REVENUE ENVISAGED) |
| projected_employees | PROPRIETOR/PROPRIETRRESS (EMPLOYEES ENVISAGED) |

## Section M – BOP

| Canonical Key | Adobe PDF Field Name |
|---|---|
| apply_for_bop_later | APPLY FOR BOP LATER |
| already_have_bop | ALREADY HAVE A BOP |
| bop_reference_number | PROPRIETOR/PROPRIETRRESS (BOP REFERENCE NO) |

## Section N – Declaration

| Canonical Key | Adobe PDF Field Name |
|---|---|
| declaration_full_name | DECLARATION (FULL NAME) |
| declaration_signature | DECLARATION (SIGNATURE) |
| declaration_date | DATE |

## AI RULE

Populate PDFs using the Adobe field names exactly as shown in the second column. Do not use OCR labels when writing values. Use the Adobe AcroForm field names as the authoritative mapping.
