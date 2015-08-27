.class Lcom/chetbox/twitter/android/TweetListActivity$2;
.super Lcom/twitter/sdk/android/core/Callback;
.source "TweetListActivity.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/chetbox/twitter/android/TweetListActivity;->onRefresh()V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation

.annotation system Ldalvik/annotation/Signature;
    value = {
        "Lcom/twitter/sdk/android/core/Callback",
        "<",
        "Lcom/twitter/sdk/android/tweetui/TimelineResult",
        "<",
        "Lcom/twitter/sdk/android/core/models/Tweet;",
        ">;>;"
    }
.end annotation


# instance fields
.field final synthetic this$0:Lcom/chetbox/twitter/android/TweetListActivity;


# direct methods
.method constructor <init>(Lcom/chetbox/twitter/android/TweetListActivity;)V
    .registers 2

    .prologue
    .line 82
    iput-object p1, p0, Lcom/chetbox/twitter/android/TweetListActivity$2;->this$0:Lcom/chetbox/twitter/android/TweetListActivity;

    invoke-direct {p0}, Lcom/twitter/sdk/android/core/Callback;-><init>()V

    return-void
.end method


# virtual methods
.method public failure(Lcom/twitter/sdk/android/core/TwitterException;)V
    .registers 5
    .param p1, "e"    # Lcom/twitter/sdk/android/core/TwitterException;

    .prologue
    const/4 v2, 0x0

    .line 90
    iget-object v0, p0, Lcom/chetbox/twitter/android/TweetListActivity$2;->this$0:Lcom/chetbox/twitter/android/TweetListActivity;

    # getter for: Lcom/chetbox/twitter/android/TweetListActivity;->mSwipeRefresh:Landroid/support/v4/widget/SwipeRefreshLayout;
    invoke-static {v0}, Lcom/chetbox/twitter/android/TweetListActivity;->access$000(Lcom/chetbox/twitter/android/TweetListActivity;)Landroid/support/v4/widget/SwipeRefreshLayout;

    move-result-object v0

    invoke-virtual {v0, v2}, Landroid/support/v4/widget/SwipeRefreshLayout;->setRefreshing(Z)V

    .line 91
    iget-object v0, p0, Lcom/chetbox/twitter/android/TweetListActivity$2;->this$0:Lcom/chetbox/twitter/android/TweetListActivity;

    invoke-virtual {p1}, Lcom/twitter/sdk/android/core/TwitterException;->getMessage()Ljava/lang/String;

    move-result-object v1

    invoke-static {v0, v1, v2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object v0

    invoke-virtual {v0}, Landroid/widget/Toast;->show()V

    .line 92
    return-void
.end method

.method public success(Lcom/twitter/sdk/android/core/Result;)V
    .registers 4
    .param p1, "result"    # Lcom/twitter/sdk/android/core/Result;

    .prologue
    .line 85
    iget-object v0, p0, Lcom/chetbox/twitter/android/TweetListActivity$2;->this$0:Lcom/chetbox/twitter/android/TweetListActivity;

    # getter for: Lcom/chetbox/twitter/android/TweetListActivity;->mSwipeRefresh:Landroid/support/v4/widget/SwipeRefreshLayout;
    invoke-static {v0}, Lcom/chetbox/twitter/android/TweetListActivity;->access$000(Lcom/chetbox/twitter/android/TweetListActivity;)Landroid/support/v4/widget/SwipeRefreshLayout;

    move-result-object v0

    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Landroid/support/v4/widget/SwipeRefreshLayout;->setRefreshing(Z)V

    .line 86
    return-void
.end method
