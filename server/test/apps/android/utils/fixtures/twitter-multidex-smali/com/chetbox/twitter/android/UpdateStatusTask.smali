.class public Lcom/chetbox/twitter/android/UpdateStatusTask;
.super Landroid/os/AsyncTask;
.source "UpdateStatusTask.java"


# annotations
.annotation system Ldalvik/annotation/Signature;
    value = {
        "Landroid/os/AsyncTask",
        "<",
        "Ljava/lang/Void;",
        "Ljava/lang/Void;",
        "Ljava/lang/Void;",
        ">;"
    }
.end annotation


# instance fields
.field private final mText:Ljava/lang/String;


# direct methods
.method public constructor <init>(Ljava/lang/String;)V
    .registers 2
    .param p1, "text"    # Ljava/lang/String;

    .prologue
    .line 13
    invoke-direct {p0}, Landroid/os/AsyncTask;-><init>()V

    .line 14
    iput-object p1, p0, Lcom/chetbox/twitter/android/UpdateStatusTask;->mText:Ljava/lang/String;

    .line 15
    return-void
.end method


# virtual methods
.method protected bridge synthetic doInBackground([Ljava/lang/Object;)Ljava/lang/Object;
    .registers 3
    .param p1, "x0"    # [Ljava/lang/Object;

    .prologue
    .line 9
    check-cast p1, [Ljava/lang/Void;

    .end local p1    # "x0":[Ljava/lang/Object;
    invoke-virtual {p0, p1}, Lcom/chetbox/twitter/android/UpdateStatusTask;->doInBackground([Ljava/lang/Void;)Ljava/lang/Void;

    move-result-object v0

    return-object v0
.end method

.method protected varargs doInBackground([Ljava/lang/Void;)Ljava/lang/Void;
    .registers 5
    .param p1, "_"    # [Ljava/lang/Void;

    .prologue
    .line 20
    :try_start_0
    invoke-static {}, Lcom/chetbox/twitter/android/Twitter4JWrapper;->twitter4j()Ltwitter4j/Twitter;

    move-result-object v1

    iget-object v2, p0, Lcom/chetbox/twitter/android/UpdateStatusTask;->mText:Ljava/lang/String;

    invoke-interface {v1, v2}, Ltwitter4j/Twitter;->updateStatus(Ljava/lang/String;)Ltwitter4j/Status;
    :try_end_9
    .catch Ltwitter4j/TwitterException; {:try_start_0 .. :try_end_9} :catch_b

    .line 24
    const/4 v1, 0x0

    return-object v1

    .line 21
    :catch_b
    move-exception v0

    .line 22
    .local v0, "e":Ltwitter4j/TwitterException;
    new-instance v1, Ljava/lang/RuntimeException;

    invoke-direct {v1, v0}, Ljava/lang/RuntimeException;-><init>(Ljava/lang/Throwable;)V

    throw v1
.end method
