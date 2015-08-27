.class Lcom/chetbox/twitter/android/TweetListActivity$3$1;
.super Ljava/lang/Object;
.source "TweetListActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/chetbox/twitter/android/TweetListActivity$3;->run()V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$1:Lcom/chetbox/twitter/android/TweetListActivity$3;


# direct methods
.method constructor <init>(Lcom/chetbox/twitter/android/TweetListActivity$3;)V
    .registers 2

    .prologue
    .line 116
    iput-object p1, p0, Lcom/chetbox/twitter/android/TweetListActivity$3$1;->this$1:Lcom/chetbox/twitter/android/TweetListActivity$3;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .registers 2

    .prologue
    .line 119
    iget-object v0, p0, Lcom/chetbox/twitter/android/TweetListActivity$3$1;->this$1:Lcom/chetbox/twitter/android/TweetListActivity$3;

    iget-object v0, v0, Lcom/chetbox/twitter/android/TweetListActivity$3;->this$0:Lcom/chetbox/twitter/android/TweetListActivity;

    invoke-virtual {v0}, Lcom/chetbox/twitter/android/TweetListActivity;->onRefresh()V

    .line 120
    return-void
.end method
