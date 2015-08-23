.class Lcom/chetbox/twitter/android/TweetListActivity$3;
.super Ljava/lang/Object;
.source "TweetListActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/chetbox/twitter/android/TweetListActivity;->onActivityResult(IILandroid/content/Intent;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lcom/chetbox/twitter/android/TweetListActivity;


# direct methods
.method constructor <init>(Lcom/chetbox/twitter/android/TweetListActivity;)V
    .registers 2

    .prologue
    .line 109
    iput-object p1, p0, Lcom/chetbox/twitter/android/TweetListActivity$3;->this$0:Lcom/chetbox/twitter/android/TweetListActivity;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .registers 3

    .prologue
    .line 114
    const-wide/16 v0, 0x7d0

    :try_start_2
    invoke-static {v0, v1}, Ljava/lang/Thread;->sleep(J)V
    :try_end_5
    .catch Ljava/lang/InterruptedException; {:try_start_2 .. :try_end_5} :catch_10

    .line 116
    :goto_5
    iget-object v0, p0, Lcom/chetbox/twitter/android/TweetListActivity$3;->this$0:Lcom/chetbox/twitter/android/TweetListActivity;

    new-instance v1, Lcom/chetbox/twitter/android/TweetListActivity$3$1;

    invoke-direct {v1, p0}, Lcom/chetbox/twitter/android/TweetListActivity$3$1;-><init>(Lcom/chetbox/twitter/android/TweetListActivity$3;)V

    invoke-virtual {v0, v1}, Lcom/chetbox/twitter/android/TweetListActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    .line 122
    return-void

    .line 115
    :catch_10
    move-exception v0

    goto :goto_5
.end method
