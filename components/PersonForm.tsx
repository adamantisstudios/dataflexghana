"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PersonData {
  fullName: string
  dateOfBirth: string
  placeOfBirth: string
  occupation: string
  mobileNumber: string
  email: string
  tinNumber: string
  residentialAddress: {
    houseNumber: string
    streetName: string
    cityDistrict: string
  }
  occupationalAddress: {
    houseNumber: string
    streetName: string
    cityDistrict: string
  }
}

interface PersonFormProps {
  title: string
  data: PersonData
  onChange: (data: PersonData) => void
}

export default function PersonForm({ title, data, onChange }: PersonFormProps) {
  const handleChange = (field: string, value: string) => {
    const keys = field.split(".")
    const newData = { ...data }

    let current: any = newData
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    onChange(newData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Personal Information</h3>

          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={data.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={data.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="placeOfBirth">Place of Birth *</Label>
              <Input
                id="placeOfBirth"
                value={data.placeOfBirth}
                onChange={(e) => handleChange("placeOfBirth", e.target.value)}
                placeholder="Enter place of birth"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="occupation">Occupation *</Label>
              <Input
                id="occupation"
                value={data.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
                placeholder="Enter occupation"
                required
              />
            </div>
            <div>
              <Label htmlFor="tinNumber">TIN Number</Label>
              <Input
                id="tinNumber"
                value={data.tinNumber}
                onChange={(e) => handleChange("tinNumber", e.target.value)}
                placeholder="Enter TIN number"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Contact Information</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobileNumber">Mobile Number *</Label>
              <Input
                id="mobileNumber"
                value={data.mobileNumber}
                onChange={(e) => handleChange("mobileNumber", e.target.value)}
                placeholder="Enter mobile number"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>
        </div>

        {/* Residential Address */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Residential Address</h3>

          <div>
            <Label htmlFor="residentialHouseNumber">House Number</Label>
            <Input
              id="residentialHouseNumber"
              value={data.residentialAddress.houseNumber}
              onChange={(e) => handleChange("residentialAddress.houseNumber", e.target.value)}
              placeholder="Enter house number"
            />
          </div>

          <div>
            <Label htmlFor="residentialStreetName">Street Name</Label>
            <Input
              id="residentialStreetName"
              value={data.residentialAddress.streetName}
              onChange={(e) => handleChange("residentialAddress.streetName", e.target.value)}
              placeholder="Enter street name"
            />
          </div>

          <div>
            <Label htmlFor="residentialCityDistrict">City/District</Label>
            <Input
              id="residentialCityDistrict"
              value={data.residentialAddress.cityDistrict}
              onChange={(e) => handleChange("residentialAddress.cityDistrict", e.target.value)}
              placeholder="Enter city or district"
            />
          </div>
        </div>

        {/* Occupational Address */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Occupational Address</h3>

          <div>
            <Label htmlFor="occupationalHouseNumber">House Number</Label>
            <Input
              id="occupationalHouseNumber"
              value={data.occupationalAddress.houseNumber}
              onChange={(e) => handleChange("occupationalAddress.houseNumber", e.target.value)}
              placeholder="Enter house number"
            />
          </div>

          <div>
            <Label htmlFor="occupationalStreetName">Street Name</Label>
            <Input
              id="occupationalStreetName"
              value={data.occupationalAddress.streetName}
              onChange={(e) => handleChange("occupationalAddress.streetName", e.target.value)}
              placeholder="Enter street name"
            />
          </div>

          <div>
            <Label htmlFor="occupationalCityDistrict">City/District</Label>
            <Input
              id="occupationalCityDistrict"
              value={data.occupationalAddress.cityDistrict}
              onChange={(e) => handleChange("occupationalAddress.cityDistrict", e.target.value)}
              placeholder="Enter city or district"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
