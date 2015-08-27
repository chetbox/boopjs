.class public Lcom/chetbox/twitter/android/LaunchActivity;
.super Landroid/app/Activity;
.source "LaunchActivity.java"


# direct methods
.method public constructor <init>()V
    .registers 1

    .prologue
    .line 10
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V

    return-void
.end method

.method private static isUserLoggedIn()Z
    .registers 2

    .prologue
    .line 28
    invoke-static {}, Lcom/twitter/sdk/android/Twitter;->getSessionManager()Lcom/twitter/sdk/android/core/SessionManager;

    move-result-object v1

    invoke-interface {v1}, Lcom/twitter/sdk/android/core/SessionManager;->getActiveSession()Lcom/twitter/sdk/android/core/Session;

    move-result-object v0

    check-cast v0, Lcom/twitter/sdk/android/core/TwitterSession;

    .line 29
    .local v0, "session":Lcom/twitter/sdk/android/core/TwitterSession;
    if-eqz v0, :cond_e

    const/4 v1, 0x1

    :goto_d
    return v1

    :cond_e
    const/4 v1, 0x0

    goto :goto_d
.end method


# virtual methods
.method protected onCreate(Landroid/os/Bundle;)V
    .registers 5
    .param p1, "savedInstanceState"    # Landroid/os/Bundle;

    .prologue
    .line 14
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    .line 16
    invoke-static {}, Lcom/chetbox/twitter/android/LaunchActivity;->isUserLoggedIn()Z

    move-result v2

    if-eqz v2, :cond_1c

    const-class v0, Lcom/chetbox/twitter/android/TweetListActivity;

    .line 20
    .local v0, "activity":Ljava/lang/Class;, "Ljava/lang/Class<+Landroid/app/Activity;>;"
    :goto_b
    new-instance v1, Landroid/content/Intent;

    invoke-direct {v1, p0, v0}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    .line 21
    .local v1, "newActivity":Landroid/content/Intent;
    const/high16 v2, 0x2000000

    invoke-virtual {v1, v2}, Landroid/content/Intent;->setFlags(I)Landroid/content/Intent;

    .line 22
    invoke-virtual {p0, v1}, Lcom/chetbox/twitter/android/LaunchActivity;->startActivity(Landroid/content/Intent;)V

    .line 24
    invoke-virtual {p0}, Lcom/chetbox/twitter/android/LaunchActivity;->finish()V

    .line 25
    return-void

    .line 16
    .end local v0    # "activity":Ljava/lang/Class;, "Ljava/lang/Class<+Landroid/app/Activity;>;"
    .end local v1    # "newActivity":Landroid/content/Intent;
    :cond_1c
    const-class v0, Lcom/chetbox/twitter/android/LoginActivity;

    goto :goto_b
.end method
