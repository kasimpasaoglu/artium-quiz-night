"use client";

import { CheckIcon, ImageIcon, RadioIcon, SendIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { DifficultyBadge } from "@/components/admin/difficulty-badge";
import { QuizThemePreview } from "@/components/admin/quiz-theme-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServerAction } from "@/hooks/use-server-action";
import { postJson } from "@/lib/api-fetch";
import { parseFontKey } from "@/lib/fonts";
import { API_ROUTES } from "@/lib/routes";
import { truncate } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { setActiveQuiz } from "@/server/actions/quiz";

export interface LiveQuizListItem {
  id: string;
  title: string;
  isActive: boolean;
}

export interface LiveQuestionRow {
  id: string;
  text: string;
  imageUrl: string | null;
  durationSec: number;
  difficulty: number;
  orderIndex: number;
}

export interface LiveActiveQuiz {
  id: string;
  title: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundUrl: string | null;
  fontKey: string;
  questions: LiveQuestionRow[];
}

interface LiveModePanelProps {
  quizzes: LiveQuizListItem[];
  activeQuiz: LiveActiveQuiz | null;
}

const QUESTION_TEXT_LIMIT = 80;

export function LiveModePanel({ quizzes, activeQuiz }: LiveModePanelProps) {
  // Son gönderilen soru — sadece UX hint, persist edilmez (refresh'te kaybolur).
  const [lastSentQuestionId, setLastSentQuestionId] = useState<string | null>(null);

  const resetSession = useServerAction(
    async () => {
      await postJson(API_ROUTES.liveReset, undefined, {
        errorFallback: "Modal kapatılamadı",
      });
    },
    {
      successMessage: "Modal kapatıldı",
      errorFallback: "Modal kapatılamadı",
      onSuccess: () => setLastSentQuestionId(null),
    },
  );

  return (
    <div className="space-y-6">
      <ActiveBanner
        activeQuiz={activeQuiz}
        resetPending={resetSession.pending}
        onReset={resetSession.run}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <QuizColumn quizzes={quizzes} activeQuizId={activeQuiz?.id ?? null} />
        <QuestionColumn
          activeQuiz={activeQuiz}
          lastSentQuestionId={lastSentQuestionId}
          onSent={setLastSentQuestionId}
        />
      </div>
    </div>
  );
}

interface ActiveBannerProps {
  activeQuiz: LiveActiveQuiz | null;
  resetPending: boolean;
  onReset: () => void;
}

function ActiveBanner({ activeQuiz, resetPending, onReset }: ActiveBannerProps) {
  if (!activeQuiz) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RadioIcon className="size-4" aria-hidden />
            <span>Henüz aktif bir quiz yok. Sol kolondan birini aktif edin.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="grid gap-4 py-4 lg:grid-cols-[240px_minmax(0,1fr)_auto] lg:items-center">
        <div className="lg:max-w-[240px]">
          <QuizThemePreview
            title={activeQuiz.title}
            primaryColor={activeQuiz.primaryColor}
            accentColor={activeQuiz.accentColor}
            textColor={activeQuiz.textColor}
            fontKey={parseFontKey(activeQuiz.fontKey)}
            backgroundUrl={activeQuiz.backgroundUrl}
          />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="gap-1">
              <RadioIcon className="size-3" aria-hidden />
              Aktif Quiz
            </Badge>
            <h2 className="text-base font-semibold">{activeQuiz.title}</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Aşağıdaki sorulardan birini &quot;Gönder&quot; ile yayına alın. Süre dolduktan sonra
            otomatik kapanma yoktur; modal&apos;ı kapatmak için sağdaki butonu kullanın.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={resetPending}
          className="min-h-11 min-w-11 self-start lg:self-center"
        >
          <XCircleIcon className="size-4" aria-hidden />
          {resetPending ? "Kapatılıyor..." : "Modal'ı Kapat"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface QuizColumnProps {
  quizzes: LiveQuizListItem[];
  activeQuizId: string | null;
}

function QuizColumn({ quizzes, activeQuizId }: QuizColumnProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Quizler</CardTitle>
      </CardHeader>
      <CardContent>
        {quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz quiz oluşturulmamış. Yönetim panelinden ekleyebilirsiniz.
          </p>
        ) : (
          <ul className="space-y-2">
            {quizzes.map((quiz) => (
              <QuizListRow key={quiz.id} quiz={quiz} isActive={quiz.id === activeQuizId} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function QuizListRow({ quiz, isActive }: { quiz: LiveQuizListItem; isActive: boolean }) {
  // setActiveQuiz başarılıysa public ekran tema güncellemesi alsın diye
  // theme endpoint'ini de tetikliyoruz. İki adım tek tıkta zincirleniyor;
  // hata varsa ilk adım toast.error ile bildiriliyor, ikinci adıma geçilmiyor.
  const activate = useServerAction(
    async (id: string) => {
      await setActiveQuiz(id);
      await postJson(
        API_ROUTES.liveTheme,
        { quizId: id },
        {
          errorFallback: "Tema güncellenemedi",
        },
      );
    },
    {
      successMessage: "Quiz aktif edildi",
      errorFallback: "Quiz aktif edilemedi",
    },
  );

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
        isActive ? "border-primary bg-primary/5" : "border-input",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isActive && <CheckIcon className="size-4 shrink-0 text-primary" aria-hidden />}
        <span className="truncate text-sm font-medium">{quiz.title}</span>
      </div>
      {isActive ? (
        <Badge variant="default" className="shrink-0">
          Aktif
        </Badge>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => activate.run(quiz.id)}
          disabled={activate.pending}
        >
          {activate.pending ? "Aktif ediliyor..." : "Aktif Et"}
        </Button>
      )}
    </li>
  );
}

interface QuestionColumnProps {
  activeQuiz: LiveActiveQuiz | null;
  lastSentQuestionId: string | null;
  onSent: (id: string) => void;
}

function QuestionColumn({ activeQuiz, lastSentQuestionId, onSent }: QuestionColumnProps) {
  if (!activeQuiz) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sorular</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Önce sol kolondan bir quiz aktif edin.</p>
        </CardContent>
      </Card>
    );
  }

  if (activeQuiz.questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sorular</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aktif quiz altında henüz soru yok. Quiz detay sayfasından soru ekleyin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Sorular</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Soru</TableHead>
              <TableHead className="w-20">Süre</TableHead>
              <TableHead className="w-32">Zorluk</TableHead>
              <TableHead className="w-32 text-right">Yayın</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeQuiz.questions.map((question, index) => (
              <SendQuestionRow
                key={question.id}
                question={question}
                index={index}
                isLastSent={question.id === lastSentQuestionId}
                onSent={onSent}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface SendQuestionRowProps {
  question: LiveQuestionRow;
  index: number;
  isLastSent: boolean;
  onSent: (id: string) => void;
}

function SendQuestionRow({ question, index, isLastSent, onSent }: SendQuestionRowProps) {
  const send = useServerAction(
    async (id: string) => {
      await postJson(
        API_ROUTES.liveSend,
        { questionId: id },
        {
          errorFallback: "Soru gönderilemedi",
        },
      );
    },
    {
      successMessage: "Soru yayına alındı",
      errorFallback: "Soru gönderilemedi",
      onSuccess: () => onSent(question.id),
    },
  );

  return (
    <TableRow className={cn(isLastSent && "bg-primary/5")}>
      <TableCell className="font-mono text-sm text-muted-foreground">{index + 1}</TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          {question.imageUrl && (
            <span
              aria-label="Görsel var"
              title="Görsel var"
              className="mt-0.5 inline-flex size-5 items-center justify-center rounded-sm bg-muted text-muted-foreground"
            >
              <ImageIcon className="size-3" />
            </span>
          )}
          <span className="text-sm text-foreground">
            {truncate(question.text, QUESTION_TEXT_LIMIT)}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{question.durationSec} sn</TableCell>
      <TableCell>
        <DifficultyBadge value={question.difficulty} />
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          onClick={() => send.run(question.id)}
          disabled={send.pending}
          className="min-h-11 min-w-11"
        >
          <SendIcon className="size-3.5" aria-hidden />
          {send.pending ? "Gönderiliyor..." : isLastSent ? "Tekrar Gönder" : "Gönder"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
