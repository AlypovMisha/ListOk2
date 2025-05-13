"use client"

import { useEffect, useState } from "react"
import { PlusCircle, Edit2, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Board as BoardComponent } from "@/components/board"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  type Board,
  type Column,
  type CardStatus,
} from "./api"

// Функция для получения названия статуса на русском
export function getStatusName(status: CardStatus): string {
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

// Функция для получения цвета статуса
export function getStatusColor(status: CardStatus): string {
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

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([])
  const [currentBoardId, setCurrentBoardId] = useState<string>("")
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null)
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [newBoardTitle, setNewBoardTitle] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")
  const [isNewBoardDialogOpen, setIsNewBoardDialogOpen] = useState(false)
  const [isRenameBoardDialogOpen, setIsRenameBoardDialogOpen] = useState(false)
  const [isDeleteBoardDialogOpen, setIsDeleteBoardDialogOpen] = useState(false)
  const [isDeleteColumnDialogOpen, setIsDeleteColumnDialogOpen] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null)
  const [renameBoardTitle, setRenameBoardTitle] = useState("")
  const [renameBoardDescription, setRenameBoardDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузка списка досок при монтировании компонента
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true)
        setError(null)
        const boardsData = await getBoards()
        setBoards(boardsData)

        if (boardsData.length > 0) {
          setCurrentBoardId(boardsData[0].id)
        }
      } catch (err) {
        setError("Не удалось загрузить доски. Пожалуйста, проверьте соединение с сервером.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchBoards()
  }, [])

  // Загрузка текущей доски при изменении currentBoardId
  useEffect(() => {
    const fetchCurrentBoard = async () => {
      if (!currentBoardId) {
        setCurrentBoard(null)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const boardData = await getBoard(currentBoardId)
        setCurrentBoard(boardData)
      } catch (err) {
        setError("Не удалось загрузить доску. Пожалуйста, проверьте соединение с сервером.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentBoard()
  }, [currentBoardId])

  // Добавить новую доску
  const addBoard = async () => {
    if (newBoardTitle.trim() === "") return

    try {
      setLoading(true)
      setError(null)
      const newBoard = await createBoard(newBoardTitle, newBoardDescription)
      setBoards([...boards, newBoard])
      setCurrentBoardId(newBoard.id)
      setNewBoardTitle("")
      setNewBoardDescription("")
      setIsNewBoardDialogOpen(false)
    } catch (err) {
      setError("Не удалось создать доску. Пожалуйста, проверьте соединение с сервером.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Переименовать доску и обновить описание
  const updateBoardDetails = async () => {
    if (renameBoardTitle.trim() === "" || !currentBoardId) return

    try {
      setLoading(true)
      setError(null)
      await updateBoard(currentBoardId, renameBoardTitle, renameBoardDescription)

      // Обновляем локальное состояние
      setBoards(
        boards.map((board) =>
          board.id === currentBoardId
            ? { ...board, title: renameBoardTitle, description: renameBoardDescription }
            : board,
        ),
      )

      if (currentBoard) {
        setCurrentBoard({
          ...currentBoard,
          title: renameBoardTitle,
          description: renameBoardDescription,
        })
      }

      setRenameBoardTitle("")
      setRenameBoardDescription("")
      setIsRenameBoardDialogOpen(false)
    } catch (err) {
      setError("Не удалось обновить доску. Пожалуйста, проверьте соединение с сервером.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Удалить доску
  const deleteBoardHandler = async () => {
    if (boards.length <= 1) {
      alert("Нельзя удалить последнюю доску")
      return
    }

    if (!currentBoardId) return

    try {
      setLoading(true)
      setError(null)
      await deleteBoard(currentBoardId)

      const newBoards = boards.filter((board) => board.id !== currentBoardId)
      setBoards(newBoards)
      setCurrentBoardId(newBoards[0]?.id || "")
      setIsDeleteBoardDialogOpen(false)
    } catch (err) {
      setError("Не удалось удалить доску. Пожалуйста, проверьте соединение с сервером.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Добавить новую колонку
  const addColumnHandler = async () => {
    if (newColumnTitle.trim() === "" || !currentBoardId || !currentBoard) return

    try {
      setLoading(true)
      setError(null)
      const newColumn = await createColumn(currentBoardId, newColumnTitle)

      // Обновляем локальное состояние
      const updatedBoard = {
        ...currentBoard,
        columns: [...currentBoard.columns, newColumn],
      }

      setCurrentBoard(updatedBoard)
      setNewColumnTitle("")
    } catch (err) {
      setError("Не удалось создать колонку. Пожалуйста, проверьте соединение с сервером.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Переименовать колонку
  const renameColumnHandler = async (columnId: string, newTitle: string) => {
    if (newTitle.trim() === "" || !currentBoard) return

    try {
      setLoading(true)
      setError(null)
      await updateColumn(columnId, newTitle)

      // Обновляем локальное состояние
      const updatedColumns = currentBoard.columns.map((column) =>
        column.id === columnId ? { ...column, title: newTitle } : column,
      )

      setCurrentBoard({
        ...currentBoard,
        columns: updatedColumns,
      })
    } catch (err) {
      setError("Не удалось переименовать колонку. Пожалуйста, проверьте соединение с сервером.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Подготовка к удалению колонки
  const prepareDeleteColumn = (columnId: string) => {
    setColumnToDelete(columnId)
    setIsDeleteColumnDialogOpen(true)
  }

  // Удалить колонку
  const deleteColumnHandler = async () => {
    if (!columnToDelete || !currentBoard) return

    try {
      setLoading(true)
      setError(null)
      await deleteColumn(columnToDelete)

      // Обновляем локальное состояние
      const updatedColumns = currentBoard.columns.filter((column) => column.id !== columnToDelete)

      setCurrentBoard({
        ...currentBoard,
        columns: updatedColumns,
      })

      setColumnToDelete(null)
      setIsDeleteColumnDialogOpen(false)
    } catch (err) {
      setError("Не удалось удалить колонку. Пожалуйста, проверьте соединение с сервером.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Обновить карточку (редактирование)
  const updateCardHandler = async (
    columnId: string,
    cardId: string,
    title: string,
    description: string,
    status: CardStatus,
    dueDate?: string,
  ) => {
    if (!currentBoard) return

    try {
      setLoading(true)
      setError(null)
      await updateCard(cardId, title, description, status, dueDate)

      // Обновляем локальное состояние
      const updatedColumns = currentBoard.columns.map((column) => {
        if (column.id === columnId) {
          const updatedCards = column.cards.map((card) =>
            card.id === cardId ? { ...card, title, description, status, dueDate } : card,
          )
          return { ...column, cards: updatedCards }
        }
        return column
      })

      setCurrentBoard({
        ...currentBoard,
        columns: updatedColumns,
      })
    } catch (err) {
      setError("Не удалось обновить карточку. Пожалуйста, проверьте соединение с сервером.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Удалить карточку
  const deleteCardHandler = async (columnId: string, cardId: string) => {
    if (!currentBoard) return

    try {
      setLoading(true)
      setError(null)
      await deleteCard(cardId)

      // Обновляем локальное состояние
      const updatedColumns = currentBoard.columns.map((column) => {
        if (column.id === columnId) {
          return {
            ...column,
            cards: column.cards.filter((card) => card.id !== cardId),
          }
        }
        return column
      })

      setCurrentBoard({
        ...currentBoard,
        columns: updatedColumns,
      })
    } catch (err) {
      setError("Не удалось удалить карточку. Пожалуйста, проверьте соединение с сервером.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Добавить новую карточку в колонку
  const addCardHandler = async (columnId: string, cardTitle: string, cardDescription: string) => {
    if (!currentBoard) return

    try {
      setLoading(true)
      setError(null)
      const newCard = await createCard(columnId, cardTitle, cardDescription)

      // Обновляем локальное состояние
      const updatedColumns = currentBoard.columns.map((column) => {
        if (column.id === columnId) {
          return {
            ...column,
            cards: [...column.cards, newCard],
          }
        }
        return column
      })

      setCurrentBoard({
        ...currentBoard,
        columns: updatedColumns,
      })
    } catch (err) {
      setError("Не удалось создать карточку. Пожалуйста, проверьте соединение с сервером.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Переместить карточку между колонками
  const moveCardHandler = async (cardId: string, sourceColumnId: string, destinationColumnId: string) => {
    if (!currentBoard) return

    try {
      setLoading(true)
      setError(null)
      await moveCard(cardId, sourceColumnId, destinationColumnId)

      // Найти карточку в исходной колонке
      const sourceColumn = currentBoard.columns.find((column) => column.id === sourceColumnId)
      if (!sourceColumn) return

      const cardToMove = sourceColumn.cards.find((card) => card.id === cardId)
      if (!cardToMove) return

      // Обновляем локальное состояние
      const updatedColumns = currentBoard.columns.map((column) => {
        if (column.id === sourceColumnId) {
          return {
            ...column,
            cards: column.cards.filter((card) => card.id !== cardId),
          }
        }
        if (column.id === destinationColumnId) {
          return {
            ...column,
            cards: [...column.cards, { ...cardToMove, columnId: destinationColumnId }],
          }
        }
        return column
      })

      setCurrentBoard({
        ...currentBoard,
        columns: updatedColumns,
      })
    } catch (err) {
      setError("Не удалось переместить карточку. Пожалуйста, проверьте соединение с сервером.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Подготовить диалог редактирования доски
  const prepareEditBoard = () => {
    if (!currentBoard) return

    setRenameBoardTitle(currentBoard.title)
    setRenameBoardDescription(currentBoard.description)
    setIsRenameBoardDialogOpen(true)
  }

  return (
    <main className="container mx-auto p-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Select value={currentBoardId} onValueChange={setCurrentBoardId} disabled={loading}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Выберите доску" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    <span className="truncate block max-w-[160px]" title={board.title}>
                      {board.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={prepareEditBoard}
              title="Редактировать доску"
              disabled={loading || !currentBoard}
            >
              <Edit2 className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDeleteBoardDialogOpen(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-100"
              title="Удалить доску"
              disabled={loading || !currentBoard}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Dialog open={isDeleteBoardDialogOpen} onOpenChange={setIsDeleteBoardDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Удаление доски</DialogTitle>
                  <DialogDescription>
                    Вы уверены, что хотите удалить доску "{currentBoard?.title}"? Это действие нельзя отменить.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex items-center justify-between mt-4">
                  <Button variant="outline" onClick={() => setIsDeleteBoardDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button variant="destructive" onClick={deleteBoardHandler} className="gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                    Удалить
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeleteColumnDialogOpen} onOpenChange={setIsDeleteColumnDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Удаление списка</DialogTitle>
                  <DialogDescription>
                    Вы уверены, что хотите удалить этот список? Все карточки в нем будут удалены. Это действие нельзя
                    отменить.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex items-center justify-between mt-4">
                  <Button variant="outline" onClick={() => setIsDeleteColumnDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button variant="destructive" onClick={deleteColumnHandler} className="gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                    Удалить
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isNewBoardDialogOpen} onOpenChange={setIsNewBoardDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={loading}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Новая доска
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новую доску</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label htmlFor="boardTitle" className="text-sm font-medium">
                      Название
                    </label>
                    <Input
                      id="boardTitle"
                      value={newBoardTitle}
                      onChange={(e) => setNewBoardTitle(e.target.value)}
                      placeholder="Введите название доски"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="boardDescription" className="text-sm font-medium">
                      Описание
                    </label>
                    <Textarea
                      id="boardDescription"
                      value={newBoardDescription}
                      onChange={(e) => setNewBoardDescription(e.target.value)}
                      placeholder="Введите описание доски"
                      rows={3}
                    />
                  </div>
                  <Button onClick={addBoard} className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Создать доску
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isRenameBoardDialogOpen} onOpenChange={setIsRenameBoardDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Редактировать доску</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label htmlFor="renameBoardTitle" className="text-sm font-medium">
                      Название
                    </label>
                    <Input
                      id="renameBoardTitle"
                      value={renameBoardTitle}
                      onChange={(e) => setRenameBoardTitle(e.target.value)}
                      placeholder="Введите название доски"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="renameBoardDescription" className="text-sm font-medium">
                      Описание
                    </label>
                    <Textarea
                      id="renameBoardDescription"
                      value={renameBoardDescription}
                      onChange={(e) => setRenameBoardDescription(e.target.value)}
                      placeholder="Введите описание доски"
                      rows={3}
                    />
                  </div>
                  <Button onClick={updateBoardDetails} className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Сохранить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Название нового списка"
              className="w-48"
              disabled={loading || !currentBoard}
            />
            <Button onClick={addColumnHandler} disabled={loading || !currentBoard}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Добавить список
            </Button>
          </div>
        </div>

        {currentBoard && (
          <div>
            <h1 className="text-2xl font-bold truncate max-w-[80%]" title={currentBoard.title}>
              {currentBoard.title}
            </h1>
            {currentBoard.description && (
              <p className="text-sm text-muted-foreground mt-1">{currentBoard.description}</p>
            )}
          </div>
        )}
      </div>

      {loading && !currentBoard ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Загрузка...</span>
        </div>
      ) : currentBoard ? (
        <BoardComponent
          columns={currentBoard.columns}
          addCard={addCardHandler}
          moveCard={moveCardHandler}
          renameColumn={renameColumnHandler}
          prepareDeleteColumn={prepareDeleteColumn}
          deleteCard={deleteCardHandler}
          updateCard={updateCardHandler}
        />
      ) : (
        <div className="text-center p-8 bg-muted rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Нет доступных досок</h2>
          <p className="text-muted-foreground mb-4">Создайте новую доску, чтобы начать работу</p>
          <Button onClick={() => setIsNewBoardDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Создать доску
          </Button>
        </div>
      )}
    </main>
  )
}

export type CardStatus = "todo" | "inprogress" | "done"

export interface Card {
  id: string
  title: string
  description: string
  columnId: string
  status: CardStatus
  dueDate?: string
  column?: Column
}

export interface Column {
  id: string
  title: string
  boardId: string
  board?: Board
  cards: Card[]
}

export interface Board {
  id: string
  title: string
  description: string
  columns: Column[]
}
