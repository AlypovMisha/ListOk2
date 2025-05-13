"use client"

import { useState } from "react"
import { Trash, MoreVertical, Edit, Calendar } from "lucide-react"
import type { Card as CardType, CardStatus } from "@/app/page"
import { Card as CardUI, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface CardProps {
  card: CardType
  columnId: string
  onDragStart: (cardId: string, columnId: string) => void
  deleteCard: (columnId: string, cardId: string) => void
  updateCard?: (
    columnId: string,
    cardId: string,
    title: string,
    description: string,
    status: CardStatus,
    dueDate?: string,
  ) => void
}

export function Card({ card, columnId, onDragStart, deleteCard, updateCard }: CardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(card.title)
  const [editDescription, setEditDescription] = useState(card.description)
  const [editStatus, setEditStatus] = useState<CardStatus>(card.status)
  const [editDueDate, setEditDueDate] = useState(card.dueDate || "")

  const handleDeleteCard = () => {
    deleteCard(columnId, card.id)
    setIsDeleteDialogOpen(false)
  }

  const handleUpdateCard = () => {
    if (editTitle.trim() === "") return

    if (updateCard) {
      updateCard(columnId, card.id, editTitle, editDescription, editStatus, editDueDate || undefined)
    }
    setIsEditDialogOpen(false)
  }

  const openEditDialog = () => {
    setEditTitle(card.title)
    setEditDescription(card.description)
    setEditStatus(card.status)
    setEditDueDate(card.dueDate || "")
    setIsEditDialogOpen(true)
  }

  // Функция для форматирования даты
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: ru })
    } catch (e) {
      return dateString
    }
  }

  // Получаем название и цвет статуса
  const statusName = (status: CardStatus) => {
    switch (status) {
      case "todo":
        return "К выполнению"
      case "inprogress":
        return "В процессе"
      case "done":
        return "Выполнено"
      default:
        return "Неизвестно"
    }
  }

  const statusColor = (status: CardStatus) => {
    switch (status) {
      case "todo":
        return "bg-yellow-100 text-yellow-800"
      case "inprogress":
        return "bg-blue-100 text-blue-800"
      case "done":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <CardUI
        className="cursor-grab active:cursor-grabbing relative group"
        draggable
        onDragStart={() => onDragStart(card.id, columnId)}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-sm truncate max-w-[200px]" title={card.title}>
              {card.title}
            </h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={openEditDialog}>
                  <Edit className="h-4 w-4" />
                  <span>Редактировать</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-500 cursor-pointer"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash className="h-4 w-4" />
                  <span>Удалить</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {card.description && (
            <p className="text-xs text-muted-foreground mt-1 break-words overflow-hidden text-ellipsis line-clamp-3">
              {card.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(card.status)}`}>
              {statusName(card.status)}
            </span>
            {card.dueDate && (
              <span className="text-xs flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(card.dueDate)}
              </span>
            )}
          </div>
        </CardContent>
      </CardUI>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удаление карточки</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить карточку "{card.title}"? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-between mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteCard}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование карточки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="editTitle" className="text-sm font-medium">
                Заголовок
              </label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Введите заголовок карточки"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="editDescription" className="text-sm font-medium">
                Описание
              </label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Введите описание карточки"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="editStatus" className="text-sm font-medium">
                Статус
              </label>
              <Select value={editStatus} onValueChange={(value) => setEditStatus(value as CardStatus)}>
                <SelectTrigger id="editStatus">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">К выполнению</SelectItem>
                  <SelectItem value="inprogress">В процессе</SelectItem>
                  <SelectItem value="done">Выполнено</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="editDueDate" className="text-sm font-medium">
                Срок выполнения
              </label>
              <Input
                id="editDueDate"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleUpdateCard}>Сохранить</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
