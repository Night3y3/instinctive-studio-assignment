"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

interface AddItemDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: any[]
    onItemAdded: () => void
}

export function AddItemDialog({ open, onOpenChange, categories, onItemAdded }: AddItemDialogProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        location: "",
        categoryId: "",
        attributes: {} as Record<string, string>,
    })
    const [loading, setLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<any>(null)
    const [newAttributeKey, setNewAttributeKey] = useState("")
    const [newAttributeValue, setNewAttributeValue] = useState("")

    const handleCategoryChange = (categoryId: string) => {
        const category = categories.find((c) => c._id === categoryId)
        setSelectedCategory(category)
        setFormData((prev) => ({ ...prev, categoryId, attributes: {} }))
    }

    const addAttribute = () => {
        if (newAttributeKey && newAttributeValue) {
            setFormData((prev) => ({
                ...prev,
                attributes: {
                    ...prev.attributes,
                    [newAttributeKey]: newAttributeValue,
                },
            }))
            setNewAttributeKey("")
            setNewAttributeValue("")
        }
    }

    const removeAttribute = (key: string) => {
        setFormData((prev) => {
            const newAttributes = { ...prev.attributes }
            delete newAttributes[key]
            return { ...prev, attributes: newAttributes }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch("/api/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    price: Number.parseFloat(formData.price) || 0,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to create listing")
            }

            setFormData({
                title: "",
                description: "",
                price: "",
                location: "",
                categoryId: "",
                attributes: {},
            })
            setSelectedCategory(null)
            onItemAdded()
        } catch (error) {
            console.error("Error creating listing:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Item Name *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter item name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe your item"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="price">Price ($)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                                        placeholder="City, State"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select value={formData.categoryId} onValueChange={handleCategoryChange} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category._id} value={category._id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Attributes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Existing attributes */}
                            {Object.entries(formData.attributes).length > 0 && (
                                <div className="space-y-2">
                                    <Label>Current Attributes</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(formData.attributes).map(([key, value]) => (
                                            <Badge key={key} variant="secondary" className="flex items-center gap-1">
                                                {key}: {value}
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttribute(key)}
                                                    className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Attribute name (e.g., Size)"
                                    value={newAttributeKey}
                                    onChange={(e) => setNewAttributeKey(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Value (e.g., Large)"
                                        value={newAttributeValue}
                                        onChange={(e) => setNewAttributeValue(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        onClick={addAttribute}
                                        disabled={!newAttributeKey || !newAttributeValue}
                                        size="sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {selectedCategory?.attributeSchema && (
                                <div className="mt-4">
                                    <Label className="text-sm text-slate-600">Suggested attributes for {selectedCategory.name}:</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedCategory.attributeSchema.map((attr: any) => (
                                            <Badge key={attr.name} variant="outline" className="text-xs">
                                                {attr.name} ({attr.type})
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Item"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
